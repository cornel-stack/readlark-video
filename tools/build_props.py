#!/usr/bin/env python3
"""Assemble the Remotion Main-composition props for a video.

Merges the per-video script with the audio timing (scenes.json), word timestamps,
and the depth layers (layers.json) into a single props JSON that the render passes
via --props. Keeps the composition fully deterministic — no fetching at render time.

Run:  python tools/build_props.py --code CL-11A  ->  out/<code>.props.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def book_code(code: str) -> str:
    return re.match(r"^([A-Z]{2}-\d{2})", code).group(1)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True)
    args = ap.parse_args()
    code = args.code
    bcode = book_code(code)

    script = json.loads((ROOT / "scripts" / f"{code}.json").read_text(encoding="utf-8"))
    audio_dir = ROOT / "assets" / "audio" / code
    scenes_timing = json.loads((audio_dir / "scenes.json").read_text())
    words = json.loads((audio_dir / "timestamps.json").read_text())["words"]

    layers_path = ROOT / "assets" / "art" / bcode / "layers.json"
    layers_by_plate = {}
    if layers_path.exists():
        for p in json.loads(layers_path.read_text())["plates"]:
            layers_by_plate[p["id"]] = {
                "flat": p["flat"],
                "layers": [{"file": f"art/{bcode}/{l['file']}", "parallax": l["parallax"]} for l in p.get("layers", [])],
            }

    timing_by_id = {s["id"]: s for s in scenes_timing["scenes"]}
    merged_scenes = []
    for sc in script["scenes"]:
        t = timing_by_id.get(sc["id"])
        if not t:
            sys.exit(f"no audio timing for scene {sc['id']} — run audio.py first")
        plate = (sc.get("on_screen") or {}).get("plate") or (sc.get("assets") or [None])[0]
        merged = {**sc, "start": t["start"], "end": t["end"]}
        if plate and plate in layers_by_plate:
            merged["plateLayers"] = layers_by_plate[plate]
        merged_scenes.append(merged)

    # Thumbnail configs (3 variants) — derived from the book + its plates, so the
    # Thumbnail composition stays generic (no per-video React).
    book_short = script["meta"]["book"].split(";")[0].split(":")[0].strip()
    distinct_plates = []
    for sc in script["scenes"]:
        pl = (sc.get("on_screen") or {}).get("plate") or (sc.get("assets") or [None])[0]
        if pl and pl not in distinct_plates:
            distinct_plates.append(pl)
    hook_q = next((s["on_screen"]["question"] for s in script["scenes"]
                   if s["template"] == "hook" and s.get("on_screen", {}).get("question")), book_short)
    is_rev = "Revision" in script["meta"].get("format", "")
    pp = [f"art/{bcode}/{p}.jpg" for p in (distinct_plates + distinct_plates + distinct_plates)[:3]]
    thumbnails = [
        {"plate": pp[0], "headline": hook_q, "sub": book_short},
        {"plate": pp[1], "headline": book_short.upper(), "sub": "REVISION" if is_rev else "FULL STORY"},
        {"plate": pp[2], "headline": "5 QUOTES TO KNOW" if is_rev else "EXPLAINED", "sub": book_short},
    ]

    props = {
        "code": code,
        "thumbnails": thumbnails,
        "meta": {
            "code": code, "book": script["meta"]["book"], "author": script["meta"]["author"],
            "year": script["meta"]["year"], "title": script["meta"]["title"], "format": script["meta"]["format"],
        },
        "chapters": script["chapters"],
        "scenes": merged_scenes,
        "words": words,
        "audio": f"audio/{code}/narration.wav",
        "total": scenes_timing["total"],
    }
    out = ROOT / "out" / f"{code}.props.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}  ({len(merged_scenes)} scenes, {len(words)} words, {props['total']:.1f}s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
