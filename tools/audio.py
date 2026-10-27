#!/usr/bin/env python3
"""Narration + captions for a video.

Two modes:
  --voice-test : synth the hook scene in three candidate voices -> out/voice-test/
                 (Checkpoint 5 — you pick one).
  (default)    : synth every scene with meta.voice via edge-tts, concatenate, run
                 faster-whisper for word-level timestamps, and write
                 assets/audio/<code>/narration.wav, timestamps.json, captions.srt
                 and scenes.json (per-scene start/end, the clock for Remotion).

The pronunciation dictionary (tools/pronounce.json) is applied to the TTS input
only — captions and timestamps keep the real spelling. Scene durations are derived
from the synthesized audio; nothing here is hand-timed.

Run:  python tools/audio.py --code CL-11A --voice-test
      python tools/audio.py --code CL-11A           (full; needs requirements-ml)
"""
from __future__ import annotations

import argparse
import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

VOICE_TEST = [
    ("en-GB-RyanNeural", "british-male"),
    ("en-GB-SoniaNeural", "british-female"),
    ("en-US-AndrewNeural", "neutral-male"),
]
BREATH_S = 0.35  # silence appended after each scene
# edge-tts neural voices run ~167 wpm at default; the project assumes 150 wpm
# ("edge-tts at a natural pace"). Slow slightly to restore that pace so durations
# land inside target_minutes and the delivery is calm enough for revision.
NARRATION_RATE = "-12%"


def load_pronounce() -> list[tuple[re.Pattern, str]]:
    data = json.loads((ROOT / "tools" / "pronounce.json").read_text(encoding="utf-8"))
    rules = []
    for k, v in data.items():
        if k.startswith("_"):
            continue
        rules.append((re.compile(rf"\b{re.escape(k)}\b", re.IGNORECASE), v))
    return rules


def say_it(text: str, rules) -> str:
    """Apply pronunciation respellings to TTS input (not to captions)."""
    for pat, repl in rules:
        text = pat.sub(repl, text)
    return text


async def synth(text: str, voice: str, out: Path, rate: str = "+0%") -> None:
    import edge_tts

    out.parent.mkdir(parents=True, exist_ok=True)
    await edge_tts.Communicate(text, voice, rate=rate).save(str(out))


def script(code: str) -> dict:
    return json.loads((ROOT / "scripts" / f"{code}.json").read_text(encoding="utf-8"))


def ffprobe_dur(path: Path) -> float:
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", str(path)],
        capture_output=True, text=True,
    )
    return float(r.stdout.strip())


# ---------------------------------------------------------------- voice test
def voice_test(code: str, rules) -> int:
    data = script(code)
    hook = next(s for s in data["scenes"] if s["template"] == "hook")
    text = say_it(hook["narration"], rules)
    out_dir = ROOT / "out" / "voice-test"
    print(f"hook: {hook['narration'][:70]}…\n")
    for voice, label in VOICE_TEST:
        dest = out_dir / f"{code}-hook-{label}.mp3"
        asyncio.run(synth(text, voice, dest))
        print(f"  ✓ {voice:<22} -> {dest.relative_to(ROOT)}  ({ffprobe_dur(dest):.1f}s)")
    print(f"\nthree samples in {out_dir.relative_to(ROOT)} — pick one; set meta.voice in the scripts.")
    return 0


# ---------------------------------------------------------------- full build
def srt_time(t: float) -> str:
    h = int(t // 3600); m = int(t % 3600 // 60); s = int(t % 60); ms = int(round((t - int(t)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def wrap_caption(words: list[dict], max_line: int = 42) -> list[str]:
    """Group words into <=2 lines of <=42 chars (sentence-aware is handled upstream)."""
    lines, cur = [], ""
    for w in words:
        tok = w["word"].strip()
        if len(cur) + len(tok) + 1 > max_line:
            lines.append(cur)
            cur = tok
            if len(lines) == 2:
                break
        else:
            cur = (cur + " " + tok).strip()
    if cur and len(lines) < 2:
        lines.append(cur)
    return lines[:2]


def build_captions(words: list[dict]) -> str:
    """Sentence-aware cues: break on sentence end or ~7 words / 3.5s."""
    cues, cur = [], []
    for w in words:
        cur.append(w)
        text = w["word"].strip()
        dur = cur[-1]["end"] - cur[0]["start"]
        if re.search(r"[.!?…]$", text) or len(cur) >= 9 or dur > 3.6:
            cues.append(cur)
            cur = []
    if cur:
        cues.append(cur)
    out = []
    for i, cue in enumerate(cues, 1):
        lines = wrap_caption(cue)
        out.append(f"{i}\n{srt_time(cue[0]['start'])} --> {srt_time(cue[-1]['end'])}\n" + "\n".join(lines) + "\n")
    return "\n".join(out)


def full_build(code: str, rules) -> int:
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("faster-whisper not installed. Run on CI or: pip install -r requirements-ml.txt")

    data = script(code)
    out_dir = ROOT / "assets" / "audio" / code
    parts_dir = out_dir / "scenes"
    parts_dir.mkdir(parents=True, exist_ok=True)
    voice = data["meta"]["voice"]

    scenes_timing, cursor, concat_list = [], 0.0, []
    for sc in data["scenes"]:
        narr = sc.get("narration", "").strip()
        wav = parts_dir / f"{sc['id']}.wav"
        if narr:
            mp3 = parts_dir / f"{sc['id']}.mp3"
            asyncio.run(synth(say_it(narr, rules), voice, mp3, rate=NARRATION_RATE))
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3),
                            "-ar", "48000", "-ac", "1", str(wav)], check=True)
        else:
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-t", "1.0",
                            "-i", "anullsrc=r=48000:cl=mono", str(wav)], check=True)
        dur = ffprobe_dur(wav)
        # append breath silence
        sil = parts_dir / f"{sc['id']}_sil.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-t", str(BREATH_S),
                        "-i", "anullsrc=r=48000:cl=mono", str(sil)], check=True)
        scenes_timing.append({"id": sc["id"], "start": round(cursor, 3),
                              "end": round(cursor + dur, 3), "narration": narr})
        cursor += dur + BREATH_S
        concat_list += [wav, sil]

    # concat all parts
    listfile = out_dir / "concat.txt"
    listfile.write_text("".join(f"file '{p}'\n" for p in concat_list), encoding="utf-8")
    narration = out_dir / "narration.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                    "-i", str(listfile), "-c", "copy", str(narration)], check=True)

    # Decode to a 16kHz mono float32 array ourselves (avoids faster-whisper's PyAV
    # path, which breaks across av versions) and feed the array to the model.
    import numpy as np
    from scipy.io import wavfile

    wav16 = out_dir / "narration16k.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(narration),
                    "-ar", "16000", "-ac", "1", "-f", "wav", str(wav16)], check=True)
    sr, samples = wavfile.read(wav16)
    audio = samples.astype(np.float32) / 32768.0

    # word timestamps via faster-whisper (alignment of known text)
    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(audio, word_timestamps=True)
    words = [{"word": w.word, "start": round(w.start, 3), "end": round(w.end, 3)}
             for seg in segments for w in (seg.words or [])]
    (out_dir / "timestamps.json").write_text(json.dumps({"words": words}, indent=2), encoding="utf-8")
    (out_dir / "scenes.json").write_text(json.dumps({"total": round(cursor, 3), "scenes": scenes_timing}, indent=2), encoding="utf-8")
    (out_dir / "captions.srt").write_text(build_captions(words), encoding="utf-8")
    print(f"narration {cursor:.1f}s, {len(words)} words -> {out_dir.relative_to(ROOT)}")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--code", required=True)
    ap.add_argument("--voice-test", action="store_true")
    args = ap.parse_args()
    rules = load_pronounce()
    return voice_test(args.code, rules) if args.voice_test else full_build(args.code, rules)


if __name__ == "__main__":
    raise SystemExit(main())
