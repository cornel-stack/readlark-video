# ReadLark Video Factory — Architecture

A code-only pipeline that turns one JSON script per video into a finished YouTube
upload package. Built for Frankenstein (CL-11A revision, CL-11B full retelling) in
Phase 1, but designed as the general system that will produce the other 136 uploads
in the backlog with **no new code** — only new data (sources, a script JSON, art
queries).

This document is the durable record of *how the system is shaped* and *why*. The
work order lives in `PLAN.md`; the hard rules live in `README.md`.

---

## 1. Hard rules (the constraints everything else bends around)

These are non-negotiable and are restated in `README.md`:

1. **Free, open-source, deterministic.** Remotion (composition), edge-tts
   (narration), faster-whisper (word timestamps), FFmpeg (mux), Python 3.11+
   (tooling), GitHub Actions (CI render). No paid APIs or keys at build time. All
   versions pinned.
2. **Imagery is only** (a) SVG drawn in code and (b) public-domain / CC0 paintings
   and original book illustrations fetched by script from Wikimedia Commons,
   Project Gutenberg and open museum APIs (Met, Rijksmuseum, Art Institute of
   Chicago, National Gallery of Art). Every image carries a licence record; lint
   fails if one is missing. **No AI-generated illustrations, ever.**
3. **Text status per video.** Frankenstein (1818) is public domain and may be
   quoted verbatim. The pipeline still carries a `text_status` flag because later
   books are in copyright and must be paraphrased with no quotes.
4. **Data-driven.** One JSON script per video drives fixed Remotion templates. A
   script may only request what the templates can draw. No per-video React.
5. **Hook first.** Every video opens on a hook question in the first 10–15 s,
   before any title card. Chapters, captions, a 45–60 s vertical cut, a thumbnail,
   and title/description/tags ship with every output. Uploads stay manual.
6. **Progressive pacing.** No still on screen longer than 20 s without a camera
   move, annotation change or cut. Lint enforces it.
7. **Brand — "Daybreak".** Dawn Coral `#F4603E` (primary), Dawn Amber `#FFAE3D`
   (secondary), warm paper `#FAF5EB` (background), indigo `#232041` (ink/text).
   The feel is a hand-drawn notebook on warm paper: ink annotations, a real hand
   drawing in, paintings pinned as plates with slow camera moves.
8. **Quality over speed.** If a shortcut would make the video look templated, don't
   take it.

---

## 2. System shape

```
             data (per video)                     fixed code (write once)
   ┌────────────────────────────────┐   ┌──────────────────────────────────────┐
   │ sources/<book>.txt             │   │ tools/*.py   (ingest, art, depth,     │
   │ scripts/<code>.json            │   │               audio, lint, package)   │
   │ assets/art/<code>/licences.json│   │ remotion/    (templates, compositions)│
   │ assets/audio/<code>/…          │   │ schema/script.schema.json             │
   └────────────────────────────────┘   └──────────────────────────────────────┘
                     │                                    │
                     └──────────────► render ◄────────────┘
                                        │
                                   out/<code>/  (upload package)
```

The dividing line is the whole design: **everything that changes per video is
data; everything that is code is shared across all 138 uploads.** The Phase-1
acceptance test ("a second book needs only sources + script + art queries") is a
direct check on whether this line held.

### Pipeline stages (one video, end to end)

```
ingest ─► (write script JSON by hand) ─► art_fetch ─► depth_layers ─► audio ─► lint ─► render ─► package
  │                                          │             │            │        │        │          │
videos.json                            art/<code>/   layers/*.png  audio/<code>/ pass?  video.mp4  out/<code>/
                                       licences.json layers.json   timestamps    │     chunks      full package
                                                                   captions.srt   gate
```

- **ingest** (`tools/ingest.py`): `book_videos_backlog.xlsx` → `backlog/videos.json`,
  one object per upload. Run once; re-run when the backlog changes.
- **art_fetch** (`tools/art_fetch.py`): resolves the script's `assets` queries
  against the PD/CC0 sources, downloads at max resolution, writes `licences.json`.
- **depth_layers** (`tools/depth_layers.py`): Depth Anything V2 (small, CPU) →
  3–4 feathered parallax layers per plate + `layers.json`; marks "flat" when a
  plate won't separate.
- **audio** (`tools/audio.py`): edge-tts per scene → concat → faster-whisper word
  timestamps → `timestamps.json` + `captions.srt`. Pronunciation dictionary
  applied before synthesis.
- **lint** (`tools/lint.py`): the gate (section 6). Fails the build on any rule
  breach.
- **render**: Remotion renders the `Main`, `Short` and `Thumbnail` compositions.
  Chunked + per-scene cache so 40-minute CL-11B fits CI limits.
- **package** (`tools/package.py`): assembles `out/<code>/`.

**Durations flow one way only.** Scene length is derived from its narration audio
(narration + a short breath); templates pace their motion to fit. Never the reverse.
Remotion's `calculateMetadata` reads `timestamps.json` to set each scene's frame
count, so audio is the clock.

---

## 3. Repository layout

```
backlog/            book_videos_backlog.xlsx, book_explainer_channel_scan.xlsx (ref),
                    ingest.py? → no: ingest lives in tools/; videos.json (generated)
schema/             script.schema.json  (the per-video JSON Schema)
sources/            frankenstein.txt and other PD source texts (scripts are built from these)
scripts/            CL-11A.json, CL-11B.json, + *.review.md fact-check notes
assets/
  hand/             source hand photos
  hand/cutouts/     transparent PNG variants + hand.json (pen-tip offsets)
  art/<code>/       fetched plates, depth layers/, licences.json, contact-sheet.png
  audio/<code>/     narration wav per scene, timestamps.json, captions.srt
remotion/           Remotion project: src/templates/, src/compositions/, Root.tsx
tools/              ingest.py, art_fetch.py, depth_layers.py, audio.py, lint.py,
                    package.py, pronounce.json
out/<code>/         the upload package (video.mp4, short.mp4, thumb-*.png,
                    captions.srt, metadata.json, licences.json)
out/voice-test/     three candidate hook voices (Checkpoint 5)
.github/workflows/  render.yml
.venv/              Python 3.12 virtualenv (pinned requirements.txt)
ARCHITECTURE.md  PLAN.md  README.md  CHANGELOG.md  Makefile  requirements.txt
```

Deviations from the brief's suggested layout, and why:
- **`assets/` not `assests/`.** The provided folder is misspelled `assests/`. It
  will be renamed to `assets/` so paths match the brief and read cleanly.
- **`ingest.py` lives in `tools/`, not `backlog/`.** All executable tooling sits in
  one place; `backlog/` holds only the workbooks and the generated `videos.json`.
- **Added `schema/` and `sources/`** (named in later deliverables; made explicit
  here).

---

## 4. Technology & versions (to be pinned at Checkpoint 1)

| Concern            | Choice                                             | Notes |
|--------------------|----------------------------------------------------|-------|
| Composition        | Remotion 4.x (React + TypeScript)                  | One project, fixed templates. |
| Runtime (JS)       | Node 20 LTS in CI (local: 25 present)              | Pin via `.nvmrc` / CI `setup-node`. |
| Narration          | edge-tts (Microsoft neural voices)                 | No key; network only at build. |
| Word timestamps    | faster-whisper (CTranslate2), `small.en` on CPU    | Forced alignment of known script to audio. |
| Depth              | Depth Anything V2 (small) via PyTorch CPU          | Heaviest dep; isolated to `depth_layers.py`. |
| Mux / concat / duck| FFmpeg 6.x                                          | H.264 + AAC, loudnorm, optional sidechain. |
| Tooling            | Python 3.11+ (3.12 here), `.venv`, pinned reqs     | `openpyxl`, `requests`, `Pillow`, etc. |
| Fonts              | Caveat / Patrick Hand (OFL) for handwriting        | Rendered to SVG paths for the stroke engine. |
| CI                 | GitHub Actions, `workflow_dispatch`, free runners  | Chunked render to fit time/space limits. |

Everything above is free and open-source. The only network access at build time is
fetching public-domain art and the edge-tts endpoint — no authenticated/paid APIs.

---

## 5. The three decisions that are expensive to undo

The brief flags these as approval-gated. Each gets a short recommendation now and a
full proposal at its checkpoint:

1. **Script schema** (Checkpoint 2). A single JSON Schema in `schema/`. Scenes carry
   `id`, `template` (closed enum of the 7 template names), `narration` (exact spoken
   words), optional `duration_hint`, `on_screen` (template-specific), `assets`
   (ids into `licences.json` / named SVG assets), and `notes`. Schema-level rules:
   first scene must be `hook`; a `title-card` within the first 20 s; quotes allowed
   only when `text_status == public_domain` and each quote names its source. Full
   schema proposed at Checkpoint 2 before either script is written.

2. **Chunked-render strategy** (Checkpoint 7). Per-scene render cache keyed on
   `hash(scene JSON + asset hashes + template version)`; Main composition rendered
   in ~5-minute chunks, concatenated with FFmpeg, re-rendering only touched chunks.
   This keeps CL-11B's 40 minutes inside free CI limits and makes edits cheap. Exact
   chunk boundaries + cache keying proposed and locked at Checkpoint 7.

3. **Depth / parallax approach** (Checkpoint 3). Depth Anything V2 (small) → 3–4
   depth-sliced layers with feathered edges and inpainted gaps + per-layer parallax
   factors in `layers.json`. Plates that don't separate cleanly are marked `flat`
   and the template falls back to a 2D push/drift. Validated on real plates at
   Checkpoint 3 before the whole set is processed.

All other choices are made here and recorded in section 8.

---

## 6. The lint gate (what "done right" means, mechanically)

`tools/lint.py` fails the build on any of:

- narration word count outside the video's `target_words`;
- narration duration outside `target_minutes`;
- first scene not `hook`, or hook longer than 15 s;
- no `title-card` within the first 20 s;
- any scene referencing a missing asset, or an image with no licence record;
- a verbatim quote in a `copyright` book;
- any caption over 2 lines (or >42 chars/line);
- any `parallax-still` / `whiteboard` scene longer than 20 s without a
  motion/annotation event;
- missing chapter markers.

Lint runs **before** render in both the Makefile and CI, so a bad script never
reaches the renderer. A deliberately broken script (hook removed, word count
doubled, image without a licence) must fail — this is a Phase-1 acceptance test.

---

## 7. Templates (the fixed vocabulary a script may call)

Seven React templates, each taking a scene object as props:

| Template        | What it draws |
|-----------------|---------------|
| `hook`          | A question written on paper by the hand while a plate fades in behind. No title. |
| `title-card`    | Book title, author, year, "ReadLark", drawn in. 4–6 s. |
| `chapter-card`  | Chapter title + the timeline strip advancing. |
| `parallax-still`| A plate with layered 2.5D camera move (push/drift/pan/reveal, chosen by seed), optional annotation. |
| `whiteboard`    | Paper + annotations drawn by the hand in sequence (character-map, theme list, …). |
| `quote-card`    | Quote written by the hand; source line in small ink. |
| `end-screen`    | 20 s, two slots for YouTube end-screen elements, paper background. |

Plus shared pieces: an SRT-driven **captions** component (Daybreak-styled, bottom
third, never overlapping annotations); a **Main** composition that assembles scenes
with `calculateMetadata` (duration from audio) and crossfades/cuts; a **Short**
composition (9:16, 45–60 s); and a **Thumbnail** composition (1280×720, three
variants).

Camera moves and other "random" choices are seeded from the scene `id`, so renders
are deterministic and reproducible across machines and CI.

---

## 8. Decisions (made without asking; recorded here)

- **D1 — `assests/` → `assets/`.** Rename the misspelled asset folder so all paths
  match the brief.
- **D2 — Python via `.venv` + pinned `requirements.txt`.** The host Python is
  externally managed (PEP 668); a project venv keeps the build hermetic and CI-
  reproducible.
- **D3 — Node 20 in CI, npm for Remotion.** Local Node 25 works; CI pins Node 20 LTS
  for Remotion stability.
- **D4 — Audio is the clock.** Scene durations derive from narration length; no
  scene has a hard-coded frame count.
- **D5 — Determinism via `id`-seeded choices.** Camera move, drift direction, frame
  jitter all hash from the scene id — no wall-clock or RNG.
- **D6 — Handwriting fonts: Caveat + Patrick Hand (OFL).** Converted to SVG paths
  for the stroke engine; licence recorded like any other asset.
- **D7 — faster-whisper does forced alignment, not transcription.** The spoken words
  are already known from the script; whisper supplies timing only, which keeps
  captions faithful to the written narration.
- **D8 — Plates are pinned exhibits.** Rendered with a paper margin, a soft shadow,
  optional ink frame lines — never full-bleed — per the brand.
- **D9 — Music bed deferred/optional in Phase 1.** If added: a CC0 / YouTube Audio
  Library track, ducked under narration via FFmpeg sidechain, trivially disabled.

### Resolved with the owner (Checkpoint 0)

- **D10 — Hand photos (was O1).** Use the two existing images in `assets/hand/`.
  The owner confirms they are already in use on the ReadLark channel and are
  licensed for that use, so rule #2 is satisfied. Their `licences.json` entry is
  recorded as `licence: "Owner-provided / channel-licensed brand asset"` with
  `source: "ReadLark channel assets"`. Note they depict a **pencil**, not a marker;
  accepted as-is.
- **D11 — Frankenstein edition: 1818 original (was O2).** Build CL-11A/B from the
  **1818** first edition (Project Gutenberg #41445), matching the backlog's stated
  year and Mary Shelley's original text. Quotes in the scripts cite the 1818
  volume/chapter. (The 1831 Holst frontispiece may still be used as a *plate* in the
  art set — it is period-appropriate PD art — but quoted wording follows 1818.)

---

## 9. What "general, not one-off" buys us

At the end of Phase 1 the acceptance test asks whether a second Frankenstein-sized
PD book could ship by adding only `sources/`, a script JSON and art queries. The
architecture is built to make that answer *yes* for PD books of the same visual
system (Style 1). It will **not** yet cover: the Style-2 "puppet" fiction lane, the
copyright paraphrase-only art path (no cover art, AI-free stills), or KCSE set
texts. Those need code and are out of Phase-1 scope — called out explicitly so the
boundary is honest.
