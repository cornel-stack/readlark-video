# Changelog

All notable changes per checkpoint. Newest first.

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
