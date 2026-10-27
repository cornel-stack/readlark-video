#!/usr/bin/env python3
"""Cut the hand photos out of their white background and calibrate the pen tip.

The two source images (assets/hand/hand-01/02.png) are opaque stock cutouts on a
white/near-white background. This removes the background by flood-filling inward
from the borders (so interior whites — the eraser, skin highlights — are kept),
feathers the alpha a touch, trims the white halo, and writes clean RGBA cutouts to
assets/hand/cutouts/ plus a hand.json recording each variant's pen-tip offset (as a
fraction of the cutout size) so the stroke engine can land the nib on the stroke.

Run:  python tools/hand_cutout.py   (or: make hand)
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "hand"
OUT = SRC / "cutouts"

# role -> (source file, tip search direction). 'top' = topmost opaque pixel is the
# nib (pencil points up); 'topleft' = up-and-left (pencil points to upper-left).
VARIANTS = {
    "write": {"src": "hand-02.png", "tip": "topleft"},
    "point": {"src": "hand-01.png", "tip": "top"},
}


def remove_white_bg(im: Image.Image, white: int = 212) -> Image.Image:
    """Make transparent the near-white region connected to the border.

    Interior whites (eraser, skin highlights, pencil text) are kept because they are
    not connected to the image edge. Uses a border-seeded binary propagation over the
    near-white mask, then feathers the alpha edge.
    """
    from scipy import ndimage

    rgb = np.array(im.convert("RGB")).astype(np.int16)
    mx = rgb.max(axis=-1)
    sat = mx - rgb.min(axis=-1)
    # Background = white or grey (low saturation) AND light. This catches the flat
    # white and the soft grey drop-shadow, while sparing warm skin (high saturation).
    bg_like = (sat < 24) & (mx > 150)
    seed = np.zeros_like(bg_like)
    seed[0, :] = seed[-1, :] = seed[:, 0] = seed[:, -1] = True
    seed &= bg_like
    bg = ndimage.binary_propagation(seed, mask=bg_like)
    # pull the edge in by 1px to kill the white halo, then feather
    bg = ndimage.binary_dilation(bg, iterations=1)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    out = im.convert("RGBA")
    a = np.array(out)
    a[:, :, 3] = alpha
    out = Image.fromarray(a)
    al = out.split()[3].filter(ImageFilter.GaussianBlur(1.0))
    out.putalpha(al)
    return out


def bbox_and_tip(im: Image.Image, direction: str) -> tuple[tuple, tuple]:
    a = np.array(im)[:, :, 3]
    ys, xs = np.where(a > 40)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    if direction == "top":
        ty = int(ys.min())
        tx = int(np.median(xs[ys == ty]))
    else:  # topleft — minimise (x + y)
        i = int(np.argmin(xs + ys))
        tx, ty = int(xs[i]), int(ys[i])
    return (int(x0), int(y0), int(x1) + 1, int(y1) + 1), (int(tx), int(ty))


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    hand = {"variants": {}, "note": "tip is the pen-nib position as a fraction of the cutout size; display anchored so nib lands on the target point."}
    for role, cfg in VARIANTS.items():
        im = Image.open(SRC / cfg["src"])
        cut = remove_white_bg(im)
        bbox, tip = bbox_and_tip(cut, cfg["tip"])
        cut = cut.crop(bbox)
        tipx, tipy = tip[0] - bbox[0], tip[1] - bbox[1]
        w, h = cut.size
        cut.save(OUT / f"{role}.png")
        hand["variants"][role] = {
            "file": f"{role}.png", "w": w, "h": h,
            "tip": [round(tipx / w, 4), round(tipy / h, 4)],
            "tip_px": [tipx, tipy], "source": cfg["src"],
        }
        print(f"{role}: {cfg['src']} -> cutouts/{role}.png  {w}x{h}  tip=({tipx},{tipy})")
    # 'rest' reuses the pointing hand (no stroke); alias for the template.
    hand["variants"]["rest"] = {**hand["variants"]["point"], "alias_of": "point"}
    (OUT / "hand.json").write_text(json.dumps(hand, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {(OUT / 'hand.json').relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
