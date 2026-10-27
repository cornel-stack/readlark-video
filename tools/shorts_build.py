#!/usr/bin/env python3
"""Build one philosophy short end-to-end: art -> narration -> ducked music -> props.

Reuses the book-pipeline engine (Wikimedia Commons PD art fetch + edge-tts) but for
the dark-cinematic vertical shorts. Line timing comes from each beat's synth length
(no whisper needed — the kinetic text is per-line, not per-word). A dark ambient bed
is generated with FFmpeg and side-chain-ducked under the narration.

Run:  python tools/shorts_build.py --code ST-01   ->  out/ST-01.short-props.json
Then render the Remotion 'ShortFilm' composition with that props file.
"""
from __future__ import annotations

import argparse
import asyncio
import datetime
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import art_fetch  # noqa: E402
import audio as audiolib  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
RATE = "-8%"   # slower, graver delivery for philosophy
GAP = 0.55     # seconds of breath between beats
MAX_PLATE = 1920


def ffprobe_dur(p: Path) -> float:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                        "-of", "default=nk=1:nw=1", str(p)], capture_output=True, text=True)
    return float(r.stdout.strip())


def fetch_plate(entry: dict, art_dir: Path, now: str) -> dict | None:
    """Largest PD/CC0 Commons image for the query, downscaled for a 1080p frame."""
    cands = []
    for title in art_fetch.search_files(entry["query"], 12):
        try:
            mw = art_fetch.image_info(title)
        except Exception:
            continue
        if not mw or not mw.get("mime", "").startswith("image/"):
            continue
        ok, lic = art_fetch.is_public_domain(mw.get("extmetadata", {}))
        if ok:
            cands.append(((mw.get("width") or 0) * (mw.get("height") or 0), title, mw, lic))
    if not cands:
        print(f"   ! no PD image for {entry['id']} ({entry['query']!r})")
        return None
    cands.sort(reverse=True, key=lambda c: c[0])
    # try the largest PD candidates in turn; a download timeout falls through to the next
    import time as _t
    for _, title, mw, lic in cands[:4]:
        ext = mw.get("extmetadata", {})
        suffix = "." + mw["mime"].split("/")[-1].replace("jpeg", "jpg")
        tmp = art_dir / (entry["id"] + suffix)
        ok = False
        for attempt in range(3):
            try:
                art_fetch.download(mw["url"], tmp)
                ok = True
                break
            except Exception:  # noqa: BLE001
                _t.sleep(2 * (attempt + 1))
        if ok:
            break
    else:
        print(f"   ! download failed for {entry['id']}")
        return None
    final = art_fetch.to_web_format(tmp)
    im = Image.open(final).convert("RGB")
    if max(im.size) > MAX_PLATE:
        im.thumbnail((MAX_PLATE, MAX_PLATE), Image.LANCZOS)
    jpg = art_dir / (entry["id"] + ".jpg")
    im.save(jpg, quality=90)
    if final != jpg:
        final.unlink(missing_ok=True)
    print(f"   ✓ {entry['id']}  [{lic}]  {im.size[0]}x{im.size[1]}")
    return {
        "id": entry["id"], "file": jpg.name, "source": "Wikimedia Commons",
        "source_url": f"https://commons.wikimedia.org/wiki/{title.replace(' ', '_')}",
        "title": art_fetch.strip_html(ext.get("ObjectName", {}).get("value")) or title,
        "creator": art_fetch.strip_html(ext.get("Artist", {}).get("value")),
        "licence": lic, "retrieved_at": now, "want": entry.get("want"),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True)
    args = ap.parse_args()
    code = args.code
    short = json.loads((ROOT / "shorts" / f"{code}.json").read_text(encoding="utf-8"))
    meta = short["meta"]
    now = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0).isoformat()

    base = ROOT / "assets" / "shorts" / code
    art_dir, aud_dir = base / "art", base / "audio"
    art_dir.mkdir(parents=True, exist_ok=True)
    aud_dir.mkdir(parents=True, exist_ok=True)

    # 1) art
    print("art:")
    licences = [r for r in (fetch_plate(p, art_dir, now) for p in short["plates"]) if r]
    (base / "licences.json").write_text(json.dumps({"id": code, "images": licences}, indent=2, ensure_ascii=False), encoding="utf-8")
    have = {r["id"] for r in licences}

    # 2) narration per beat -> timings
    print("narration:")
    rules = audiolib.load_pronounce()
    parts, timed, cursor = [], [], 0.0
    for i, b in enumerate(short["beats"]):
        mp3 = aud_dir / f"b{i}.mp3"
        wav = aud_dir / f"b{i}.wav"
        for attempt in range(4):  # edge-tts endpoint can time out intermittently
            try:
                asyncio.run(audiolib.synth(audiolib.say_it(b["text"], rules), meta["voice"], mp3, rate=RATE))
                if mp3.stat().st_size > 0:
                    break
            except Exception as e:  # noqa: BLE001
                if attempt == 3:
                    raise
                print(f"   synth retry {attempt + 1} (beat {i}): {type(e).__name__}")
                import time as _t
                _t.sleep(2 * (attempt + 1))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-ar", "48000", "-ac", "1", str(wav)], check=True)
        d = ffprobe_dur(wav)
        sil = aud_dir / f"s{i}.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-t", str(GAP), "-i", "anullsrc=r=48000:cl=mono", str(sil)], check=True)
        timed.append({"text": b["text"], "start": round(cursor, 3), "end": round(cursor + d, 3),
                      "plate": b.get("plate"), "emphasis": b.get("emphasis", False)})
        cursor += d + GAP
        parts += [wav, sil]
    total = round(cursor, 3)

    listf = aud_dir / "concat.txt"
    listf.write_text("".join(f"file '{p.name}'\n" for p in parts), encoding="utf-8")
    narration = aud_dir / "narration.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", narration.name],
                   check=True, cwd=aud_dir)

    # 3) dark ambient bed (generated — licence-clean) + side-chain duck under voice
    print("music + mix:")
    music = aud_dir / "music.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error",
                    "-f", "lavfi", "-i", f"sine=frequency=55:duration={total}",
                    "-f", "lavfi", "-i", f"sine=frequency=82.41:duration={total}",
                    "-f", "lavfi", "-i", f"sine=frequency=164.81:duration={total}",
                    "-filter_complex",
                    "[0][1][2]amix=inputs=3,tremolo=f=0.1:d=0.4,lowpass=f=420,aecho=0.8:0.9:1200:0.3,volume=0.6[m]",
                    "-map", "[m]", str(music)], check=True)
    mix = base / "mix.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(narration), "-i", str(music),
                    "-filter_complex",
                    "[1:a]volume=0.22[mv];[mv][0:a]sidechaincompress=threshold=0.02:ratio=8:attack=25:release=500[md];"
                    "[0:a][md]amix=inputs=2:normalize=0,alimiter=limit=0.95[out]",
                    "-map", "[out]", "-ar", "48000", "-ac", "2", str(mix)], check=True)

    # 4) render props
    plates = {r["id"]: f"shorts/{code}/art/{r['file']}" for r in licences}
    props = {
        "id": code, "topic": meta["topic"], "thinker": meta["thinker"],
        "thinker_dates": meta.get("thinker_dates", ""), "title": meta["title"],
        "audio": f"shorts/{code}/mix.wav", "total": total,
        "beats": [b for b in timed if (b["plate"] in have or not b["plate"])],
        "plates": plates, "attribution": short.get("attribution", meta["thinker"]),
        "cta": short.get("cta", "Follow for more"),
    }
    out = ROOT / "out" / f"{code}.short-props.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")
    print(f"\n{len(timed)} beats · {total:.1f}s · {len(licences)} plates -> {out.relative_to(ROOT)}")
    if total > 62:
        print(f"!! {total:.1f}s is over 60s — trim a beat or shorten lines")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
