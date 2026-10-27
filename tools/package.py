#!/usr/bin/env python3
"""Assemble the upload package in out/<code>/.

Copies captions + licences, and writes metadata.json: three title variants built
around meta.search_phrase, a description with chapter timestamps and the A<->B
cross-link, tags, playlist and a pinned comment. Expects video.mp4 / short.mp4 /
thumb-*.png to have been rendered into out/<code>/ by the pipeline (warns if absent).

Run:  python tools/package.py --code CL-11A
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def book_code(code: str) -> str:
    return re.match(r"^([A-Z]{2}-\d{2})", code).group(1)


def mmss(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    return f"{m:02d}:{s:02d}"


def companion(code: str) -> str | None:
    if code.endswith("A"):
        return code[:-1] + "B"
    if code.endswith("B"):
        return code[:-1] + "A"
    return None


def title_variants(meta: dict) -> list[str]:
    book = meta["book"].split(";")[0].split(":")[0].strip()
    phrase = meta["search_phrase"]
    is_rev = "Revision" in meta.get("format", "")
    base = meta["title"]
    if is_rev:
        v = [
            base,
            f"{book} Summary — Plot, Characters, Themes & 5 Quotes to Memorise",
            f"{book}, Explained for the Exam | {phrase.title()} & Analysis",
        ]
    else:
        v = [
            base,
            f"{book}: The Whole Story, Explained | {meta['author']} ({meta['year']})",
            f"{book} — Full Summary & Analysis | {phrase.title()}",
        ]
    # ensure the exact search phrase appears somewhere
    if not any(phrase.lower() in t.lower() for t in v):
        v[1] = f"{v[1]} | {phrase}"
    return v


def build_description(code: str, script: dict, timing: dict) -> str:
    meta = script["meta"]
    book = meta["book"].split(";")[0].strip()
    by_id = {s["id"]: s for s in timing["scenes"]} if timing else {}
    lines = []
    hook = next((s for s in script["scenes"] if s["template"] == "hook"), None)
    if hook:
        lines.append(hook["on_screen"].get("question", "").strip())
        lines.append("")
    lines.append(f"A code-drawn, hand-animated walk through {book} by {meta['author']} "
                 f"({meta['year']}) — public-domain art, no AI illustrations.")
    lines.append("")
    lines.append("⏱ Chapters")
    for i, ch in enumerate(script.get("chapters", [])):
        t = by_id.get(ch["first_scene"], {}).get("start", 0) if by_id else 0
        lines.append(f"{mmss(0 if i == 0 else t)} {ch['title']}")
    lines.append("")
    comp = companion(code)
    if comp:
        other = "full retelling" if code.endswith("A") else "10-minute revision video"
        lines.append(f"▶ Watch the {other} ({comp}): [link]")
        lines.append("")
    lines.append("ReadLark — classic & set-text books, drawn and explained. New videos weekly.")
    lines.append("")
    status = "quoted from the public-domain 1818 text" if meta["text_status"] == "public_domain" else "paraphrased (in copyright)"
    lines.append(f"Text: {meta['book']} — {status}. Art: public-domain / CC0 (see licences.json).")
    lines.append("")
    tags = thumb_tags(meta)
    lines.append(" ".join("#" + t.replace(" ", "") for t in tags[:6]))
    return "\n".join(lines)


def thumb_tags(meta: dict) -> list[str]:
    book = meta["book"].split(";")[0].strip()
    base = [book, f"{book} summary", f"{book} analysis", meta["author"], "English literature",
            "revision", "GCSE English", "study guide", "book summary", meta["search_phrase"]]
    if "Revision" in meta.get("format", ""):
        base += ["exam revision", "quotes", "themes"]
    else:
        base += ["full story", "explained", "audiobook summary"]
    # de-dup, keep order
    seen, out = set(), []
    for t in base:
        k = t.lower()
        if k not in seen:
            seen.add(k); out.append(t)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True)
    args = ap.parse_args()
    code = args.code
    bcode = book_code(code)
    out = ROOT / "out" / code
    out.mkdir(parents=True, exist_ok=True)

    script = json.loads((ROOT / "scripts" / f"{code}.json").read_text(encoding="utf-8"))
    meta = script["meta"]
    timing_path = ROOT / "assets" / "audio" / code / "scenes.json"
    timing = json.loads(timing_path.read_text()) if timing_path.exists() else {}

    # copy captions + licences in
    cap = ROOT / "assets" / "audio" / code / "captions.srt"
    if cap.exists():
        shutil.copy(cap, out / "captions.srt")
    lic = ROOT / "assets" / "art" / bcode / "licences.json"
    if lic.exists():
        shutil.copy(lic, out / "licences.json")

    titles = title_variants(meta)
    metadata = {
        "code": code,
        "titles": titles,
        "title_primary": titles[0],
        "search_phrase": meta["search_phrase"],
        "description": build_description(code, script, timing),
        "tags": thumb_tags(meta),
        "playlist": meta["book"].split(";")[0].strip(),
        "category": "Education",
        "companion": companion(code),
        "pinned_comment": (
            f"{next((s['on_screen'].get('question') for s in script['scenes'] if s['template']=='hook'), '')} "
            f"Tell me what you think below — and grab the companion video in the description."
        ),
        "text_status": meta["text_status"],
        "visual_system": "Style 1: public-domain art + 2.5D parallax + hand annotations",
    }
    (out / "metadata.json").write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # report what's present vs expected
    expected = ["video.mp4", "short.mp4", "thumb-1.png", "thumb-2.png", "thumb-3.png", "captions.srt", "licences.json", "metadata.json"]
    print(f"package out/{code}/:")
    missing = []
    for f in expected:
        ok = (out / f).exists()
        print(f"  {'✓' if ok else '· missing'}  {f}")
        if not ok:
            missing.append(f)
    if missing:
        print(f"\nnote: {len(missing)} file(s) not yet rendered: {missing}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
