#!/usr/bin/env python3
"""Render a video in chunks, skipping chunks whose cache hash is unchanged, then
concatenate them into out/<code>/video.mp4.

Expects tools/chunk_plan.py to have written out/<code>.chunks.json, and the chunks
dir (out/<code>/chunks) to have been restored from the Actions cache. A chunk is
re-rendered only when out/<code>/chunks/chunk-NN.mp4 is missing or its stored .hash
differs from the plan — so edits re-render only the touched chunks.

Run:  python tools/render_chunks.py --code CL-11A [--no-cache]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REMOTION = ROOT / "remotion"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True)
    ap.add_argument("--no-cache", action="store_true", help="re-render every chunk")
    ap.add_argument("--concurrency", default="2")
    args = ap.parse_args()
    code = args.code

    plan = json.loads((ROOT / "out" / f"{code}.chunks.json").read_text())
    props = ROOT / "out" / f"{code}.props.json"
    out = ROOT / "out" / code
    chunks_dir = out / "chunks"
    chunks_dir.mkdir(parents=True, exist_ok=True)

    rendered, cached = 0, 0
    for c in plan["chunks"]:
        mp4 = chunks_dir / f"chunk-{c['i']:02d}.mp4"
        hashfile = chunks_dir / f"chunk-{c['i']:02d}.hash"
        up_to_date = (not args.no_cache and mp4.exists() and hashfile.exists()
                      and hashfile.read_text().strip() == c["hash"])
        if up_to_date:
            print(f"chunk {c['i']:02d}: cached ({c['hash']})")
            cached += 1
            continue
        print(f"chunk {c['i']:02d}: render frames {c['start']}-{c['end']}  scenes={c['scene_ids']}")
        subprocess.run(
            ["npx", "remotion", "render", "src/index.ts", "Main", str(mp4),
             "--props=" + str(props), f"--frames={c['start']}-{c['end']}",
             "--crf=21", f"--concurrency={args.concurrency}", "--log=info"],
            cwd=REMOTION, check=True,
        )
        hashfile.write_text(c["hash"])
        rendered += 1

    # concat (stream copy — chunks share codec/params and start on a keyframe).
    # ffmpeg runs with cwd=chunks_dir so the list uses relative filenames.
    listfile = chunks_dir / "concat.txt"
    listfile.write_text("".join(f"file 'chunk-{c['i']:02d}.mp4'\n" for c in plan["chunks"]), encoding="utf-8")
    video = out / "video.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                    "-i", "concat.txt", "-c", "copy", str(video)], check=True, cwd=chunks_dir)
    print(f"\n{rendered} rendered, {cached} cached -> {video.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
