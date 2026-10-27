#!/usr/bin/env python3
"""Plan the chunked render for a video and compute per-chunk cache keys.

Splits the Main timeline into fixed ~5-minute chunks by absolute frame range. Each
chunk's cache key is a hash of the scenes overlapping its range + their art source
URLs + TEMPLATE_VERSION + the frame range, so a chunk only re-renders when something
that affects its pixels changes. Writes out/<code>.chunks.json and prints all_hash
(the combined key) for the workflow's Actions-cache key.

Run:  python tools/chunk_plan.py --code CL-11A
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
CHUNK_FRAMES = 9000  # 5 minutes at 30fps
# Bump to force a full re-render (e.g. after a template change that the per-scene
# hash would not otherwise capture).
TEMPLATE_VERSION = "v1"


def book_code(code: str) -> str:
    return re.match(r"^([A-Z]{2}-\d{2})", code).group(1)


def sha(obj) -> str:
    return hashlib.sha256(json.dumps(obj, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True)
    args = ap.parse_args()
    code = args.code
    bcode = book_code(code)

    props = json.loads((ROOT / "out" / f"{code}.props.json").read_text(encoding="utf-8"))
    scenes = props["scenes"]
    total_frames = round(props["total"] * FPS)

    # art source URLs keep the key sensitive to which artwork was used
    lic_path = ROOT / "assets" / "art" / bcode / "licences.json"
    src_url = {}
    if lic_path.exists():
        for r in json.loads(lic_path.read_text())["images"]:
            src_url[r["id"].split("--")[0]] = r.get("image_url")

    # scene frame spans
    spans = []
    for i, s in enumerate(scenes):
        f0 = round(s["start"] * FPS)
        f1 = round(scenes[i + 1]["start"] * FPS) if i + 1 < len(scenes) else total_frames
        spans.append((f0, f1, s))

    n = math.ceil(total_frames / CHUNK_FRAMES)
    chunks = []
    for i in range(n):
        cs = i * CHUNK_FRAMES
        ce = min((i + 1) * CHUNK_FRAMES, total_frames)
        members = [s for (f0, f1, s) in spans if f0 < ce and f1 > cs]
        key = sha({
            "range": [cs, ce],
            "template_version": TEMPLATE_VERSION,
            "scenes": [{k: v for k, v in s.items() if k != "notes"} for s in members],
            "art": {sid: src_url.get(sid) for s in members for sid in [((s.get("on_screen") or {}).get("plate")) or (s.get("assets") or [None])[0]] if sid},
        })
        chunks.append({"i": i, "start": cs, "end": ce - 1, "hash": key,
                       "scene_ids": [s["id"] for s in members]})

    all_hash = sha([c["hash"] for c in chunks])
    plan = {"code": code, "fps": FPS, "chunk_frames": CHUNK_FRAMES, "total_frames": total_frames,
            "template_version": TEMPLATE_VERSION, "chunks": chunks, "all_hash": all_hash}
    (ROOT / "out" / f"{code}.chunks.json").write_text(json.dumps(plan, indent=2), encoding="utf-8")
    print(f"{len(chunks)} chunks, total {total_frames} frames, all_hash={all_hash}")
    # expose the cache key to the workflow
    gh_out = os.environ.get("GITHUB_OUTPUT")
    if gh_out:
        with open(gh_out, "a") as f:
            f.write(f"all_hash={all_hash}\n")
            f.write(f"n_chunks={len(chunks)}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
