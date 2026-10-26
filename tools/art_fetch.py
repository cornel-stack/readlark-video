#!/usr/bin/env python3
"""Fetch public-domain plates for a video from Wikimedia Commons.

Given a video code (e.g. CL-11A), this reads the per-book art-queries manifest at
assets/art/<BOOK>/queries.json, searches Wikimedia Commons for each plate, keeps
only images whose licence metadata is clearly Public Domain or CC0, downloads them
at full resolution, and writes assets/art/<BOOK>/licences.json with a complete
provenance record for every image. Finally it builds a contact sheet PNG.

Primary source is Wikimedia Commons (no key required, PD/CC0 only). The Met, Art
Institute of Chicago and National Gallery of Art are available as open APIs too, but
Commons carries every Romantic-era painting Frankenstein needs with the cleanest
licence metadata. Rijksmuseum is intentionally not used: its API requires a key,
which would break hard rule 1 (no keys at build time).

Run:  python tools/art_fetch.py --code CL-11A
      (or: make art CODE=CL-11A)

Nothing that is not clearly PD/CC0 is ever saved. If an image has no usable licence
record it is skipped and logged; licences.json only ever contains cleared images.
"""
from __future__ import annotations

import argparse
import datetime
import html
import json
import re
import sys
import time
from pathlib import Path

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
COMMONS = "https://commons.wikimedia.org/w/api.php"
UA = "ReadLarkVideoFactory/0.1 (https://youtube.com/@readlark; amalacornel@gmail.com)"

# Accept only these licences. Matched case-insensitively against the Commons
# 'License' machine code and the human 'LicenseShortName'.
PD_CODES = {"pd", "cc0", "cc-pd", "pd-art", "pd-old", "pd-old-100", "pd-us"}
PD_PHRASES = ("public domain", "cc0", "no restrictions", "pd-")


def book_code(code: str) -> str:
    """CL-11A -> CL-11 ; FI-19 -> FI-19."""
    m = re.match(r"^([A-Z]{2}-\d{2})", code)
    if not m:
        sys.exit(f"bad code: {code}")
    return m.group(1)


def api_get(params: dict) -> dict:
    params = {**params, "format": "json"}
    for attempt in range(4):
        try:
            r = requests.get(COMMONS, params=params, headers={"User-Agent": UA}, timeout=40)
            r.raise_for_status()
            return r.json()
        except Exception as e:  # noqa: BLE001
            if attempt == 3:
                raise
            time.sleep(1.5 * (attempt + 1))
    return {}


def search_files(query: str, limit: int = 15) -> list[str]:
    # filetype:bitmap keeps us to raster images (excludes the PDFs / book scans
    # that plain text queries otherwise surface on Commons).
    data = api_get({
        "action": "query", "list": "search", "srsearch": query + " filetype:bitmap",
        "srnamespace": 6, "srlimit": limit,
    })
    return [r["title"] for r in data.get("query", {}).get("search", [])]


def strip_html(s: str | None) -> str | None:
    if not s:
        return None
    return html.unescape(re.sub(r"<[^>]+>", "", s)).strip() or None


def image_info(title: str) -> dict | None:
    data = api_get({
        "action": "query", "titles": title, "prop": "imageinfo",
        "iiprop": "url|extmetadata|size|mime",
    })
    pages = data.get("query", {}).get("pages", {})
    for _, page in pages.items():
        infos = page.get("imageinfo")
        if infos:
            return infos[0]
    return None


def is_public_domain(meta: dict) -> tuple[bool, str | None]:
    """Return (ok, licence_label) using Commons extmetadata."""
    code = (meta.get("License", {}).get("value") or "").lower().strip()
    short = (meta.get("LicenseShortName", {}).get("value") or "").strip()
    short_l = short.lower()
    if code in PD_CODES or any(code.startswith(p) for p in ("pd", "cc0")):
        return True, (short or code.upper())
    if any(p in short_l for p in PD_PHRASES):
        return True, (short or "Public domain")
    return False, (short or code or None)


def download(url: str, dest: Path) -> int:
    with requests.get(url, headers={"User-Agent": UA}, timeout=180, stream=True) as r:
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        size = 0
        with open(dest, "wb") as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
                size += len(chunk)
    return size


def to_web_format(path: Path) -> Path:
    """Remotion needs jpg/png. Convert tiff/webp/gif to jpg; return final path."""
    if path.suffix.lower() in (".jpg", ".jpeg", ".png"):
        return path
    jpg = path.with_suffix(".jpg")
    im = Image.open(path).convert("RGB")
    im.save(jpg, quality=92)
    path.unlink(missing_ok=True)
    return jpg


def contact_sheet(records: list[dict], art_dir: Path, out: Path, cols: int = 5) -> None:
    thumb_w, thumb_h, pad, label_h = 360, 230, 14, 26
    n = len(records)
    rows = (n + cols - 1) // cols
    W = cols * (thumb_w + pad) + pad
    H = rows * (thumb_h + label_h + pad) + pad
    sheet = Image.new("RGB", (W, H), (250, 245, 235))  # Daybreak paper
    try:
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(sheet)
        font = ImageFont.load_default()
    except Exception:  # noqa: BLE001
        draw = font = None
    for i, rec in enumerate(records):
        r, c = divmod(i, cols)
        x = pad + c * (thumb_w + pad)
        y = pad + r * (thumb_h + label_h + pad)
        try:
            im = Image.open(art_dir / rec["file"]).convert("RGB")
            im.thumbnail((thumb_w, thumb_h))
            sheet.paste(im, (x + (thumb_w - im.width) // 2, y + (thumb_h - im.height) // 2))
        except Exception:  # noqa: BLE001
            pass
        if draw:
            draw.text((x + 2, y + thumb_h + 4), f"{rec['id']}", fill=(35, 32, 65), font=font)
    sheet.save(out)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True, help="video code, e.g. CL-11A")
    ap.add_argument("--limit", type=int, default=15, help="search candidates per plate")
    ap.add_argument("--ids", help="comma-separated plate ids to (re)fetch; merges into existing licences.json")
    args = ap.parse_args()

    bcode = book_code(args.code)
    art_dir = ROOT / "assets" / "art" / bcode
    manifest_path = art_dir / "queries.json"
    if not manifest_path.exists():
        sys.exit(f"no art-queries manifest: {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    only_ids = set(args.ids.split(",")) if args.ids else None
    plates = [p for p in manifest["plates"] if (only_ids is None or p["id"] in only_ids)]

    # Merge mode: start from existing records, drop the ones we're re-fetching.
    records: list[dict] = []
    if only_ids and (ROOT / "assets" / "art" / bcode / "licences.json").exists():
        prev = json.loads((ROOT / "assets" / "art" / bcode / "licences.json").read_text())
        records = [r for r in prev["images"]
                   if r["id"].split("--")[0] not in only_ids]
    skipped: list[str] = []
    now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()

    for entry in plates:
        pid, query, count = entry["id"], entry["query"], entry.get("count", 1)
        print(f"\n▶ {pid}: {query!r}")
        # exact_title pins one specific Commons file (bypasses search/largest) — used
        # when a plain query is ambiguous between several works by the same artist.
        titles = [entry["exact_title"]] if entry.get("exact_title") else search_files(query, args.limit)
        # Collect every PD/CC0 image candidate, then take the largest `count`
        # (highest resolution). Specific artist queries keep the top results on-topic.
        candidates = []
        for title in titles:
            meta_wrap = image_info(title)
            if not meta_wrap or not meta_wrap.get("mime", "").startswith("image/"):
                continue
            ext = meta_wrap.get("extmetadata", {})
            ok, licence = is_public_domain(ext)
            if not ok:
                continue
            area = (meta_wrap.get("width") or 0) * (meta_wrap.get("height") or 0)
            candidates.append((area, title, meta_wrap, ext, licence))
        candidates.sort(key=lambda c: c[0], reverse=True)

        got = 0
        for area, title, meta_wrap, ext, licence in candidates:
            if got >= count:
                break
            mime = meta_wrap.get("mime", "")
            suffix = "." + (mime.split("/")[-1].replace("jpeg", "jpg"))
            stem = pid if got == 0 else f"{pid}--{got+1}"
            try:
                sz = download(meta_wrap["url"], art_dir / (stem + suffix))
                final = to_web_format(art_dir / (stem + suffix))
            except Exception as e:  # noqa: BLE001
                print(f"   download failed: {e}")
                continue
            rec = {
                "id": stem,
                "file": final.name,
                "source": "Wikimedia Commons",
                "source_url": f"https://commons.wikimedia.org/wiki/{title.replace(' ', '_')}",
                "image_url": meta_wrap["url"],
                "title": strip_html(ext.get("ObjectName", {}).get("value")) or title.replace("File:", "").rsplit(".", 1)[0],
                "creator": entry.get("creator_override") or strip_html(ext.get("Artist", {}).get("value")),
                "date": strip_html(ext.get("DateTimeOriginal", {}).get("value")) or strip_html(ext.get("DateTime", {}).get("value")),
                "licence": licence,
                "credit": strip_html(ext.get("Credit", {}).get("value")),
                "width": meta_wrap.get("width"),
                "height": meta_wrap.get("height"),
                "bytes": sz,
                "retrieved_at": now,
                "want": entry.get("want"),
            }
            records.append(rec)
            got += 1
            print(f"   ✓ {final.name}  [{licence}]  {rec['width']}x{rec['height']}  {sz//1024} KB")
            time.sleep(0.3)
        if got == 0:
            skipped.append(pid)
            print(f"   ! no PD/CC0 image found for {pid}")

    licences_path = art_dir / "licences.json"
    licences_path.write_text(json.dumps({
        "book_code": bcode, "source_primary": "Wikimedia Commons (PD/CC0 only)",
        "generated_at": now, "count": len(records), "images": records,
    }, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    sheet_path = art_dir / "contact-sheet.png"
    if records:
        contact_sheet(records, art_dir, sheet_path)

    print(f"\n{'='*60}")
    print(f"fetched {len(records)} plates -> {art_dir.relative_to(ROOT)}")
    print(f"licences.json: {len(records)} records")
    print(f"contact sheet: {sheet_path.relative_to(ROOT)}")
    if skipped:
        print(f"!! no image for: {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
