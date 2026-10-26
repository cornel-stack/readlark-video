#!/usr/bin/env python3
"""Slice each plate into 2.5D parallax layers using monocular depth estimation.

APPROACH (proposed at Checkpoint 3 — the "depth/parallax" decision):
  1. Estimate depth with Depth Anything V2 (small model, CPU) via transformers.
  2. Split the depth range into N bands (default 3) at histogram quantiles, so each
     layer carries a roughly comparable slab of the scene (far / mid / near).
  3. Feather each layer's alpha (Gaussian blur) so edges don't tear during motion.
  4. Inpaint the hole left behind each nearer layer (OpenCV Telea) so that when the
     camera parallaxes and the far layer shifts, there is no visible gap.
  5. Write layer PNGs (RGBA, back-to-front) + layers.json with a per-layer parallax
     factor (far moves least, near moves most) that the Remotion parallax-still
     template multiplies the camera offset by.
  6. If a plate has too little depth variation to separate cleanly (e.g. a flat,
     frontal painting), mark it "flat": true. The template then uses a 2D push/drift
     instead of layered parallax — never a broken cut-out.

All free & open-source and CPU-only. Heavy deps (torch, transformers, opencv) live
in requirements-ml.txt and are installed only once this approach is approved.

Run:  python tools/depth_layers.py --code CL-11A [--layers 3] [--only plate-sea-of-ice] [--limit N]
      (or, wired into: make art CODE=CL-11A)
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Parallax factor per layer, back (far) -> front (near), as a fraction of frame
# width the layer travels at full camera push. Far ≈ still; near ≈ noticeable.
PARALLAX_BY_LAYERS = {
    2: [0.015, 0.06],
    3: [0.010, 0.045, 0.09],
    4: [0.008, 0.03, 0.06, 0.10],
}
# Below this normalized depth standard deviation, a plate is treated as "flat".
FLAT_STD_THRESHOLD = 0.055


def book_code(code: str) -> str:
    m = re.match(r"^([A-Z]{2}-\d{2})", code)
    if not m:
        sys.exit(f"bad code: {code}")
    return m.group(1)


def load_depth_pipeline():
    """Lazy import so the file is inspectable without the ML deps installed."""
    try:
        from transformers import pipeline  # type: ignore
    except ImportError:
        sys.exit("transformers/torch not installed. Run: "
                 ".venv/bin/pip install -r requirements-ml.txt  (then re-run)")
    # Depth Anything V2 small — CPU is fine for still plates.
    return pipeline(task="depth-estimation",
                    model="depth-anything/Depth-Anything-V2-Small-hf")


def process_plate(img_path: Path, out_dir: Path, pid: str, n_layers: int, depth_pipe):
    import numpy as np  # noqa
    import cv2  # noqa
    from PIL import Image  # noqa

    image = Image.open(img_path).convert("RGB")
    # Downscale to a working resolution: 2560px long side is ample for a 1080p
    # frame with push-in headroom, and keeps depth/inpaint memory sane on CI runners
    # (some plates are 70+ megapixels).
    MAX_SIDE = 2560
    if max(image.size) > MAX_SIDE:
        image.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
    depth_out = depth_pipe(image)
    depth = np.array(depth_out["depth"], dtype=np.float32)
    depth = (depth - depth.min()) / (np.ptp(depth) + 1e-6)  # 0=far, 1=near
    rgb = np.array(image)
    H, W = depth.shape

    std = float(depth.std())
    if std < FLAT_STD_THRESHOLD:
        return {"id": pid, "flat": True, "depth_std": round(std, 4),
                "layers": [], "note": "low depth variance — template uses 2D move"}

    # Quantile band edges so each layer holds a comparable slab of the scene.
    edges = [float(np.quantile(depth, q)) for q in np.linspace(0, 1, n_layers + 1)]
    factors = PARALLAX_BY_LAYERS[n_layers]
    out_dir.mkdir(parents=True, exist_ok=True)
    layers = []
    accum_fg = np.zeros((H, W), dtype=np.uint8)  # union of nearer layers (for inpaint)

    # Build near -> far so we can inpaint each layer behind the ones in front of it.
    for li in range(n_layers - 1, -1, -1):
        lo, hi = edges[li], edges[li + 1]
        mask = ((depth >= lo) & (depth <= hi)).astype(np.uint8) * 255
        feather = cv2.GaussianBlur(mask, (0, 0), sigmaX=max(1.0, W / 400))
        rgba = np.dstack([rgb, feather]).astype(np.uint8)
        # Inpaint colour where nearer layers sit, so reveals have no holes.
        if accum_fg.any():
            rgba[:, :, :3] = cv2.inpaint(rgba[:, :, :3], accum_fg, 6, cv2.INPAINT_TELEA)
        fname = f"{pid}.L{li}.png"
        Image.fromarray(rgba).save(out_dir / fname)
        layers.append({"index": li, "file": f"layers/{fname}",
                       "parallax": factors[li], "depth_band": [round(lo, 3), round(hi, 3)]})
        accum_fg = np.clip(accum_fg + (mask > 127).astype(np.uint8) * 255, 0, 255)

    layers.sort(key=lambda d: d["index"])  # back -> front
    return {"id": pid, "flat": False, "depth_std": round(std, 4), "layers": layers}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True)
    ap.add_argument("--layers", type=int, default=3, choices=[2, 3, 4])
    ap.add_argument("--only", help="process a single plate id")
    ap.add_argument("--limit", type=int, help="process only the first N plates (for testing)")
    args = ap.parse_args()

    bcode = book_code(args.code)
    art_dir = ROOT / "assets" / "art" / bcode
    lic = json.loads((art_dir / "licences.json").read_text(encoding="utf-8"))
    images = lic["images"]
    if args.only:
        images = [im for im in images if im["id"] == args.only]
    if args.limit:
        images = images[: args.limit]
    if not images:
        sys.exit("no matching plates in licences.json")

    print(f"loading Depth Anything V2 (small)… processing {len(images)} plate(s)")
    depth_pipe = load_depth_pipeline()
    layers_dir = art_dir / "layers"
    results = []
    for im in images:
        print(f"▶ {im['id']}")
        res = process_plate(art_dir / im["file"], layers_dir, im["id"], args.layers, depth_pipe)
        flat = "FLAT (2D move)" if res["flat"] else f"{len(res['layers'])} layers"
        print(f"   {flat}  depth_std={res['depth_std']}")
        results.append(res)

    out = art_dir / "layers.json"
    out.write_text(json.dumps({"book_code": bcode, "n_layers": args.layers,
                               "plates": results}, indent=2) + "\n", encoding="utf-8")
    flat_n = sum(1 for r in results if r["flat"])
    print(f"\nwrote {out.relative_to(ROOT)}  ({len(results)} plates, {flat_n} flat)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
