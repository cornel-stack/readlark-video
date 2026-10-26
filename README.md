# ReadLark Video Factory

A code-only pipeline that turns one JSON script per video into a finished YouTube
upload package — animated book retellings and exam-revision videos. Phase 1 ships
the two Frankenstein videos (CL-11A revision, CL-11B full retelling) through a
pipeline built as the general system that will produce the other 136 uploads in
`backlog/`.

See `ARCHITECTURE.md` for how it's shaped and why, and `PLAN.md` for the work order
and checkpoints.

---

## Hard rules (never broken)

1. **Free, open-source, deterministic.** Remotion (composition), edge-tts
   (narration), faster-whisper (word timestamps), FFmpeg (mux), Python 3.11+
   (tooling), GitHub Actions (CI). No paid APIs or keys at build time. Versions
   pinned.
2. **Imagery is only** (a) SVG drawn in code and (b) public-domain / CC0 paintings
   and original book illustrations fetched by script from Wikimedia Commons,
   Project Gutenberg and open museum APIs (Met, Rijksmuseum, Art Institute of
   Chicago, National Gallery of Art). Every image carries a licence record; lint
   fails if one is missing. **No AI-generated illustrations, ever.**
3. **Text status per video.** Public-domain books (e.g. Frankenstein 1818) may be
   quoted verbatim; copyright books are paraphrased with no quotes. Carried as a
   `text_status` flag.
4. **Data-driven.** One JSON script per video drives fixed Remotion templates. A
   script may only request what the templates can draw. No per-video React.
5. **Hook first.** Every video opens on a hook question in the first 10–15 s, before
   any title card. Chapters, captions, a 45–60 s vertical cut, a thumbnail, and
   title/description/tags ship with every output. Uploads stay manual.
6. **Progressive pacing.** No still on screen longer than 20 s without a camera
   move, annotation change or cut. Lint enforces it.
7. **Brand — "Daybreak".** Dawn Coral `#F4603E`, Dawn Amber `#FFAE3D`, warm paper
   `#FAF5EB`, indigo `#232041`. A hand-drawn notebook on warm paper: ink
   annotations, a real hand drawing in, paintings pinned as plates with slow camera
   moves.
8. **Quality over speed.** If a shortcut would make the video look templated, don't
   take it.

---

## Setup (once)

```bash
# Python tooling
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

# Remotion
cd remotion && npm install && cd ..
```

Heavier ML deps (edge-tts, faster-whisper, Depth Anything) install from
`requirements-ml.txt` at their checkpoints.

Verify the build:

```bash
make ingest     # writes backlog/videos.json — 138 entries, validated
make preview    # renders the 10s placeholder to out/_placeholder.mp4
```

---

## Run one video end to end

Every stage is a `make` target scoped by the video `CODE` (e.g. `CL-11A`):

```bash
make ingest              # backlog xlsx -> backlog/videos.json (once, or when the backlog changes)
make hand                # cut out the hand photos (once, shared by all videos)

make art     CODE=CL-11A # fetch PD/CC0 plates + depth layers -> assets/art/CL-11/
make audio   CODE=CL-11A # edge-tts narration + whisper word timestamps + captions.srt
make lint    CODE=CL-11A # enforce the lint gate (fails the build on any rule breach)
make render  CODE=CL-11A # render Main / Short / Thumbnail compositions
make package CODE=CL-11A # assemble the upload package -> out/CL-11A/

make all     CODE=CL-11A # art -> audio -> lint -> render -> package
```

The upload package in `out/<CODE>/` contains: `video.mp4` (1080p30, H.264/AAC),
`captions.srt`, `short.mp4`, `thumb-1/2/3.png`, `metadata.json` (titles,
description with chapter timestamps + A↔B cross-link, tags, playlist, pinned
comment) and `licences.json`. You upload it to YouTube by hand.

---

## Add a new video (no new code for a same-style PD book)

1. Add the source text to `sources/<book>.txt` (from Project Gutenberg).
2. Write `scripts/<CODE>.json` against `schema/script.schema.json` — scenes may only
   use the fixed template names and request assets by id.
3. List the art queries in the script's `assets`; run `make art CODE=<CODE>`.
4. `make all CODE=<CODE>`.

This holds for public-domain classics in the same visual system (Style 1). The
Style-2 fiction "puppet" lane, the copyright paraphrase-only art path, and KCSE set
texts need additional code and are out of Phase-1 scope (see `ARCHITECTURE.md` §9).

---

## Repository layout

See `ARCHITECTURE.md` §3. In short: `backlog/` (workbooks + generated
`videos.json`), `schema/`, `sources/`, `scripts/`, `assets/` (hand, art, audio),
`remotion/` (templates + compositions), `tools/` (Python stages), `out/<code>/`
(packages), `.github/workflows/`.
