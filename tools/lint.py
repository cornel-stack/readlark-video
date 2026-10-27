#!/usr/bin/env python3
"""The build gate. Fails (exit 1) if a video breaks a hard rule.

Checks (from the brief):
  - narration word count outside target_words
  - narration duration outside target_minutes
  - first scene not a hook, or hook longer than 15 s
  - no title-card within the first 20 s
  - any scene references a missing asset / an image with no licence record
  - a verbatim quote in a copyright book
  - any caption over 2 lines (or >42 chars/line)
  - any parallax-still / whiteboard scene longer than 20 s with no motion/annotation
  - missing chapters

Needs the audio timing (scenes.json) and the art licences (licences.json), so run
after `audio` and `art`. Run:  python tools/lint.py --code CL-11A
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MAX_HOOK_S = 15
TITLE_BY_S = 20
MAX_STILL_S = 20
MAX_CAPTION_LINES = 2
MAX_CAPTION_CHARS = 42


def book_code(code: str) -> str:
    return re.match(r"^([A-Z]{2}-\d{2})", code).group(1)


def wc(s: str) -> int:
    return len(re.findall(r"[A-Za-z0-9']+", s or ""))


def parse_srt(text: str):
    cues = []
    for block in re.split(r"\n\s*\n", text.strip()):
        lines = [l for l in block.splitlines() if l.strip()]
        if len(lines) >= 3 and "-->" in lines[1]:
            cues.append(lines[2:])
    return cues


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True)
    args = ap.parse_args()
    code = args.code
    bcode = book_code(code)
    errors: list[str] = []
    warnings: list[str] = []

    script = json.loads((ROOT / "scripts" / f"{code}.json").read_text(encoding="utf-8"))
    meta = script["meta"]
    scenes = script["scenes"]

    # chapters present
    if not script.get("chapters"):
        errors.append("missing chapters")
    ids = {s["id"] for s in scenes}
    for ch in script.get("chapters", []):
        if ch.get("first_scene") not in ids:
            errors.append(f"chapter '{ch.get('title')}' -> unknown scene '{ch.get('first_scene')}'")

    # word count
    words = sum(wc(s.get("narration", "")) for s in scenes)
    lo, hi = meta["target_words"]
    if not (lo <= words <= hi):
        errors.append(f"narration {words} words outside target_words {meta['target_words']}")

    # first scene hook
    if scenes[0]["template"] != "hook":
        errors.append(f"first scene is '{scenes[0]['template']}', must be hook")

    # quotes only in public-domain
    if meta["text_status"] == "copyright":
        if any(s["template"] == "quote-card" for s in scenes):
            errors.append("quote-card present in a copyright text")

    # ---- timing-based checks (need scenes.json) ----
    timing_path = ROOT / "assets" / "audio" / code / "scenes.json"
    if timing_path.exists():
        timing = json.loads(timing_path.read_text())
        by_id = {s["id"]: s for s in timing["scenes"]}
        total_min = timing["total"] / 60
        tlo, thi = meta["target_minutes"]
        if not (tlo <= total_min <= thi):
            errors.append(f"duration {total_min:.2f} min outside target_minutes {meta['target_minutes']}")

        # hook length: from its start to the next scene's start
        order = timing["scenes"]
        def span(i):
            s = order[i]["start"]
            e = order[i + 1]["start"] if i + 1 < len(order) else timing["total"]
            return e - s
        if order and span(0) > MAX_HOOK_S:
            errors.append(f"hook is {span(0):.1f}s (> {MAX_HOOK_S}s)")

        # title-card within first 20s
        tc = next((s for s in scenes if s["template"] == "title-card"), None)
        if not tc:
            errors.append("no title-card")
        elif by_id.get(tc["id"], {}).get("start", 999) > TITLE_BY_S:
            errors.append(f"title-card starts at {by_id[tc['id']]['start']:.1f}s (> {TITLE_BY_S}s)")

        # stills/whiteboards longer than 20s must have motion/annotation
        for i, sc in enumerate(scenes):
            t = by_id.get(sc["id"])
            if not t:
                continue
            idx = [o["id"] for o in order].index(sc["id"])
            d = span(idx)
            if sc["template"] in ("parallax-still", "whiteboard") and d > MAX_STILL_S:
                os_ = sc.get("on_screen") or {}
                has_motion = sc["template"] == "parallax-still" and os_.get("camera", "auto") != "none"
                has_ann = bool(os_.get("annotations"))
                if not (has_motion or has_ann):
                    errors.append(f"scene '{sc['id']}' ({sc['template']}) is {d:.1f}s with no motion/annotation")
    else:
        warnings.append("scenes.json missing — skipped duration/timing checks (run audio.py)")

    # ---- asset / licence checks ----
    lic_path = ROOT / "assets" / "art" / bcode / "licences.json"
    licensed = set()
    if lic_path.exists():
        licensed = {r["id"].split("--")[0] for r in json.loads(lic_path.read_text())["images"]}
    for sc in scenes:
        for a in sc.get("assets", []):
            if a.startswith("svg:"):
                continue
            if lic_path.exists() and a not in licensed:
                errors.append(f"scene '{sc['id']}' asset '{a}' has no licence record")
    if not lic_path.exists():
        warnings.append("licences.json missing — skipped asset licence checks (run art_fetch.py)")

    # ---- caption checks ----
    srt_path = ROOT / "assets" / "audio" / code / "captions.srt"
    if srt_path.exists():
        for i, cue in enumerate(parse_srt(srt_path.read_text(encoding="utf-8")), 1):
            if len(cue) > MAX_CAPTION_LINES:
                errors.append(f"caption {i} has {len(cue)} lines (> {MAX_CAPTION_LINES})")
            for line in cue:
                if len(line) > MAX_CAPTION_CHARS:
                    errors.append(f"caption {i} line >{MAX_CAPTION_CHARS} chars: {line!r}")
    else:
        warnings.append("captions.srt missing — skipped caption checks (run audio.py)")

    # ---- positioning guard: books channel, not exam-prep ----
    # Flag viewer-facing exam/revision framing so regenerated scripts stay book-focused.
    EXAM_TERMS = re.compile(r"\b(exam|examiner|examiners|revision|gcse|a-level|marks|essay|syllabus|set text|memoris)\w*", re.IGNORECASE)
    viewer_text = [("meta.title", meta.get("title", ""))]
    viewer_text += [(f"chapter '{c.get('title')}'", c.get("title", "")) for c in script.get("chapters", [])]
    viewer_text += [(f"scene '{s['id']}' narration", s.get("narration", "")) for s in scenes]
    viewer_text += [(f"scene '{s['id']}' {k}", str(v)) for s in scenes for k, v in (s.get("on_screen") or {}).items() if isinstance(v, str)]
    for where, text in viewer_text:
        m = EXAM_TERMS.search(text or "")
        if m:
            warnings.append(f"exam-prep wording '{m.group(0)}' in {where} — this is a books channel, keep it about the book")

    # ---- growth nudges (warnings, not hard fails) ----
    book_kw = meta["book"].split(";")[0].split(":")[0].split()[0].lower()
    hook_narr = (scenes[0].get("narration", "") or "").lower()
    if book_kw not in hook_narr:
        warnings.append(f"hook doesn't say '{book_kw}' — name the book/search term in the first line (SEO + search intent)")
    last = scenes[-1]
    if last["template"] == "end-screen" and meta["code"][-1:] in ("A", "B"):
        comp = meta["code"][:-1] + ("B" if meta["code"].endswith("A") else "A")
        pts = (last.get("on_screen") or {}).get("points_to")
        if pts != comp:
            warnings.append(f"end-screen points_to '{pts}', expected companion '{comp}' (A↔B cross-link)")

    # ---- report ----
    for w in warnings:
        print(f"  warning: {w}")
    if errors:
        print(f"\nLINT FAILED ({code}): {len(errors)} error(s)", file=sys.stderr)
        for e in errors:
            print(f"  ✗ {e}", file=sys.stderr)
        return 1
    print(f"lint OK: {code}  ({words} words, {len(scenes)} scenes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
