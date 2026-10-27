# Changelog

All notable changes per checkpoint. Newest first.

## Checkpoint 6 — Templates + compositions (2026-10-27)

- Seven data-driven templates: hook, title-card, chapter-card, parallax-still
  (4 seeded camera moves), whiteboard (character-map + theme-list drawn in order),
  quote-card, end-screen. Components: Handwriting, Captions (word-timed, ≤2 lines/
  ≤42 chars), DrawnStroke, TimelineStrip, ParallaxPlate, Hand.
- Main composition: assembles scenes from props, narration.wav as the clock
  (calculateMetadata), soft scene fades, captions overlay. Short (9:16 teaser) and
  Thumbnail (1280×720, 3 variants from build_props) added.
- `build_props.py` merges script + audio timing + depth layers + thumbnail configs.
- `.github/workflows/render.yml` renders the full pipeline on CI; `preview.yml`
  makes a small 480p review bundle so the 312 MB master needn't be pulled.
- **CL-11A fully rendered on CI** (run 40486315259, 22m): 1080p30 H.264, 8.69 min,
  all 7 templates + captions. Verified via sampled frames + 480p preview.

## Checkpoint 5 — Narration + captions (2026-10-27)

- `tools/audio.py`: edge-tts per scene → concat → faster-whisper word timestamps →
  timestamps.json + captions.srt (≤2 lines/≤42 chars, sentence-aware) + scenes.json
  (the per-scene clock). pronounce.json applied to TTS input only. Decodes wav→array
  for whisper (dodges a PyAV break). NARRATION_RATE -12% ≈ 150 wpm.
- Three hook voices offered → **en-GB-SoniaNeural (British female) chosen**; set in
  both scripts. CL-11A narration lands 8.69 min (in [8,12]).

## Checkpoint 4 — Hand + annotations (2026-10-27)

- `tools/hand_cutout.py`: border-connected background removal (saturation+light mask,
  keeps interior whites), auto-crop, nib calibration → `assets/hand/cutouts/write.png`
  + `point.png` + `hand.json` (normalized pen-tip offsets). Clean alpha (1% partial).
- Remotion stroke engine: `lib/stroke.ts` (deterministic path sampling / point-at-
  length / arrowhead — no DOM), `lib/fonts.ts` (Caveat handwriting), `Hand` (nib-
  anchored, lifts/fades between items), `ParallaxPlate` (pinned 2.5D exhibit).
- `HandSample` 20s composition rendered on CI (`.github/workflows/sample.yml`):
  parallax plate push-in + hand writing a label + drawing an arrow.
- Parallax model reworked after first render showed gaps/smears: **opaque full-frame
  base + cumulative nearer cut-outs** (no holes, no inpaint smear); fixed a ~40×
  offset bug. Verified on CI run 40476565032.

## Checkpoint 3 — Art pipeline (2026-10-27)

- **GitHub repo created (public): github.com/cornel-stack/readlark-video.** Strategy
  workbooks purged from all git history and kept local-only (gitignored); CI uses the
  committed `videos.json`. `ingest.py` falls back to `videos.json` when the workbook
  is absent.
- **Depth/parallax approved & working on CI** (Depth Anything V2 small, 3 layers).
  `.github/workflows/art.yml` fetches plates + runs depth on GitHub Actions (free
  runners), not locally. First run surfaced a NumPy 2.0 `ptp` break and a
  memory/size issue (70MP plates) — both fixed (np.ptp; downscale to 2560px).
  Second run: **28 plates, all got 3 layers, 0 flat**, depth_std 0.27–0.31. Verified
  the layers recompose cleanly and parallax-shift with gap-free inpainting.
- Heavy compute (depth, and later renders) runs on CI per the owner's instruction.
- `assets/art/CL-11/queries.json`: art-query manifest (data, like the script) mapping
  each plate id to an artist-specific Wikimedia Commons query; supports `count`,
  `exact_title`, `creator_override`.
- `tools/art_fetch.py`: searches Wikimedia Commons (no key), filters strictly to
  PD/CC0 via licence metadata, keeps the highest-res candidate, converts TIFF→JPG,
  writes full provenance to `licences.json`, builds a contact sheet. `--ids` merge
  mode for gap-fills. Rijksmuseum omitted (API needs a key — rule 1).
- **27 plates fetched**, all PD/CC0, all 19 script-referenced ids covered, every
  record has complete provenance. High-res Romantic works (Friedrich *Eismeer*,
  *Wanderer*, *Abbey in the Oakwood*, *Monk by the Sea*, *Moonrise*; Fuseli
  *Nightmare*; Wright alchemist + *Iron Forge*; Turner storm; Church *Aurora*;
  Biard *Magdalena Bay*; Van Gogh *Potato Eaters*; Rembrandt *Anatomy Lesson*).
- `tools/depth_layers.py` written (Depth Anything V2 small → feathered 3-layer
  parallax + inpaint + `layers.json`; "flat" fallback). **Approach pending approval
  before the heavy install/run** (the ask-first depth/parallax decision).
- `.gitignore`: plate binaries ignored (regenerable from `licences.json`); provenance
  JSON tracked.

## Checkpoint 2 — Script schema + both Frankenstein scripts (2026-10-27)

- `schema/script.schema.json` (JSON Schema 2020-12): meta / chapters / scenes;
  per-template `on_screen` validation; first scene must be `hook`; quotes blocked in
  `copyright` texts; `quote-card` requires `notes` + `source`. Approved before scripts.
- `tools/validate_script.py` + `schema/example.json` (one scene per template). Proven:
  valid example passes; first-scene-not-hook rejected; copyright-with-quote rejected.
- `sources/frankenstein.txt`: Project Gutenberg #41445, the **1818** first edition
  (verified publisher imprint). 1818 chapter numbering used throughout.
- `scripts/CL-11A.json` — revision, 24 scenes, 1,285 words (~8.6 min). In range.
- `scripts/CL-11B.json` — full retelling, 55 scenes, 5,434 words (~36.2 min). In
  range; single part (under 45 min, no split).
- Fact-check pass: all 12 distinct verbatim quotes verified character-for-character
  against the source (line refs in the review files); key plot claims read directly
  (eight-feet stature, the drowning-girl rescue, Felix's beating, William's miniature,
  Safie "the Arabian"). Notes + judgment calls in `scripts/CL-11A.review.md` and
  `scripts/CL-11B.review.md`.

## Checkpoint 1 — Skeleton + backlog queue (2026-10-26)

- Repo layout created (ARCHITECTURE §3). Renamed `assests/` → `assets/`; moved the
  two provided hand photos to `assets/hand/hand-01.png`, `hand-02.png`.
- `tools/ingest.py`: reads `backlog/book_videos_backlog.xlsx` → `backlog/videos.json`
  (138 entries). Validates: 138 entries, codes unique, every CL book has A and B —
  all pass.
- Remotion project (`remotion/`) initialised, pinned to `remotion@4.0.539`,
  React 19.1.0. Daybreak theme + Paper background + a placeholder composition.
- Placeholder renders **10.0 s at 1920×1080, 30fps, H.264** locally (verified with
  ffprobe; brand colours confirmed from an extracted frame).
- `Makefile` with targets: `ingest, hand, art, audio, lint, render, package, all,
  preview` (CODE-scoped targets guarded).
- `requirements.txt` (openpyxl 3.1.5, requests 2.34.2, Pillow 13.0.0) pinned;
  `requirements-ml.txt` for deferred heavy deps.
- `README.md` (hard rules, setup, run one video, add a new one), `.gitignore`.

## Checkpoint 0 — Read & align (2026-10-26)

- Read the backlog workbook (all six tabs). 138 uploads / 88 books confirmed.
- Validated: 138 unique codes; every CL book paired A+B; lane/format totals
  reconcile (50 revision, 50 full retelling, 30 fiction, 8 KCSE).
- Flagged the hand photos as stock-photo pencil cutouts (resolved: owner confirms
  channel-licensed — ARCHITECTURE D10).
- Wrote `ARCHITECTURE.md` and `PLAN.md`. Approved.
- Decisions locked: hand = existing channel images (D10); Frankenstein edition =
  1818 original, Gutenberg #41445 (D11).
