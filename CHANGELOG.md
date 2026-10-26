# Changelog

All notable changes per checkpoint. Newest first.

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
