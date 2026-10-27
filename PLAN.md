# ReadLark Video Factory — Phase 1 Plan

**Goal:** ship CL-11A (Frankenstein revision, 8–12 min) and CL-11B (Frankenstein
full retelling, 35–45 min) as complete upload packages, through a pipeline that will
later produce the other 136 uploads in the backlog. Build only what Frankenstein
needs — but build it as the general system, not a one-off.

Work the checkpoints in order. **At each CHECKPOINT: stop, show the files (and a
rendered sample where relevant), and wait for approval.** Commit after each
checkpoint. Files are the source of truth, not the chat.

Legend: `[ ]` todo · `[~]` in progress · `[x]` done.

---

## CHECKPOINT 0 — Read & align (this checkpoint)

- [x] Read the backlog workbook (Read Me, Formats, Backlog, Schedule, By Book,
      Progress). 138 uploads / 88 books confirmed; CL-11A & CL-11B detail captured.
- [x] Validate the backlog: 138 unique codes, every CL book has an A and a B, lane
      and format totals reconcile.
- [x] Inspect the hand photos. **Flag:** they are stock-photo pencil cutouts, not
      your real hand holding a marker (see ARCHITECTURE O1).
- [x] Write `ARCHITECTURE.md` and `PLAN.md`.
- [x] **Approved.** ARCHITECTURE + PLAN signed off. Decisions locked: hand = the
      existing channel-licensed stock images (ARCHITECTURE D10); edition = **1818**
      original, Gutenberg #41445 (D11). Proceeding to Checkpoint 1.

---

## CHECKPOINT 1 — Skeleton + backlog queue (Deliverable 1)

- [ ] Create the repo layout (ARCHITECTURE §3); rename `assests/` → `assets/`.
- [ ] `.venv` + pinned `requirements.txt`; `remotion/` initialised with pinned deps.
- [ ] `tools/ingest.py`: `book_videos_backlog.xlsx` → `backlog/videos.json`, one
      object per upload: `code, book, author, year, lane, text_status, format,
      target_minutes [lo,hi], target_words [lo,hi], structure, phase, week, status`.
- [ ] Validate on generate: 138 entries, codes unique, every CL book has A and B.
- [ ] `Makefile` targets: `ingest, hand, art CODE=, audio CODE=, lint CODE=,
      render CODE=, package CODE=, all CODE=`.
- [ ] `README.md`: hard rules, run one video end to end, add a new one.
- [ ] `CHANGELOG.md` started.
- [ ] A placeholder Remotion composition renders **10 s at 1080p30 locally**.
- [ ] **CHECKPOINT:** skeleton builds; `videos.json` has 138 entries; placeholder
      renders. → commit.

## CHECKPOINT 2 — Schema + both Frankenstein scripts (Deliverable 2)

- [ ] `schema/script.schema.json` (meta, chapters, scenes; first scene `hook`;
      `title-card` ≤20 s; quotes only when PD and each quote cites volume/chapter).
- [ ] Download the Gutenberg plain text → `sources/frankenstein.txt` (state 1818 vs
      1831 and why — per O2).
- [ ] `scripts/CL-11A.json` — revision, 1,200–1,800 words: hook → plot in three
      volumes → characters map → themes → 5 quotes to memorise (cited) → "what the
      examiner is really asking" → end screen to CL-11B.
- [ ] `scripts/CL-11B.json` — full retelling, 5,250–6,750 words: hook → Walton's
      letters → Vol I → Vol II → Vol III → closing (the creature's own words) → end
      screen to CL-11A. Chaptered by volume/episode. Split at the Vol II boundary if
      >45 min at 150 wpm, and say so.
- [ ] Fact-check pass against `sources/frankenstein.txt`; uncertainties logged in
      `scripts/CL-11A.review.md` and `CL-11B.review.md`.
- [ ] **CHECKPOINT:** schema + both scripts + review notes. You read the scripts
      before anything renders. → commit.

## CHECKPOINT 3 — Art pipeline (Deliverable 3)

- [ ] `tools/art_fetch.py`: query Wikimedia Commons, Project Gutenberg (incl. the
      1831 Theodor von Holst frontispiece), Met, Rijksmuseum, Art Institute of
      Chicago, NGA for Romantic-era plates fitting the scenes. Max resolution.
      Reject anything not clearly PD/CC0. Write `assets/art/CL-11/licences.json`
      (`id, file, source_url, title, creator, date, licence, retrieved_at`).
- [ ] `tools/depth_layers.py`: Depth Anything V2 (small, CPU) → 3–4 feathered
      layers + inpainted gaps + `layers.json` parallax factors; mark `flat` when a
      plate won't separate.
- [ ] Plates treated as pinned exhibits (paper margin, soft shadow, optional ink
      frame).
- [ ] **CHECKPOINT:** `assets/art/CL-11/` populated (25–40 plates), `licences.json`
      complete, a contact-sheet PNG to review. → commit.

## CHECKPOINT 4 — Hand + annotations (Deliverable 4)

- [ ] Resolve O1 first. Cut out the hand photos (clean alpha), 2–3 variants
      (writing, pointing, resting); calibrate pen-tip offset → `assets/hand/cutouts/`
      + `hand.json`.
- [ ] Stroke engine: any SVG path revealed progressively while the hand follows the
      end point (~2–3 chars/s; lift+fade between items).
- [ ] Annotation vocabulary: handwritten label, underline/circle on a plate, arrow,
      character-map, theme list, quote reveal, timeline strip.
- [ ] **CHECKPOINT:** a 20 s sample — a plate with a camera move, the hand writing a
      label and drawing an arrow, on paper. You judge the look here. → commit.

## CHECKPOINT 5 — Narration + captions (Deliverable 5)

- [ ] `tools/audio.py`: edge-tts per scene → concat → faster-whisper word timestamps
      → `timestamps.json` + `captions.srt` (≤2 lines, ≤42 chars, sentence-aware).
- [ ] `tools/pronounce.json` applied pre-synthesis (Clerval, Elizabeth Lavenza, De
      Lacey, Safie, Ingolstadt, Geneva, Chamounix, Orkneys, Walton).
- [ ] Scene durations derived from narration (+breath); templates pace to fit.
- [ ] Render the CL-11A hook in three voices (2 British, 1 neutral) →
      `out/voice-test/` as three MP3s.
- [ ] **CHECKPOINT:** three voice samples; you pick one. → commit.

## CHECKPOINT 6 — Templates + compositions (Deliverable 6)

- [ ] Seven templates (ARCHITECTURE §7) + captions component + `Main` (with
      `calculateMetadata`), `Short` (9:16, 45–60 s), `Thumbnail` (1280×720, ×3).
- [ ] Camera moves/choices seeded from scene `id` (deterministic).
- [ ] Optional ducked CC0 music bed, easy to disable.
- [ ] **CHECKPOINT:** CL-11A rendered at 1080p30 locally; you watch it. → commit.

## CHECKPOINT 7 — Lint, render, package, CI (Deliverable 7)

- [ ] `tools/lint.py` enforcing the full gate (ARCHITECTURE §6).
- [ ] Chunked render + per-scene cache (hash of scene JSON + asset hashes + template
      version); ~5-min chunks + FFmpeg concat. Lock the strategy with you first.
- [ ] `tools/package.py` → `out/<code>/`: `video.mp4` (1080p30 H.264/AAC),
      `captions.srt`, `short.mp4`, `thumb-1/2/3.png`, `metadata.json` (3 titles
      around `search_phrase`, description with chapter timestamps + A↔B cross-link,
      tags, playlist, pinned comment), `licences.json`.
- [ ] `.github/workflows/render.yml`: `workflow_dispatch` on a video code →
      ingest → audio → lint → render (chunked) → package → upload artifact. Works on
      a public repo's free runners.
- [ ] **CHECKPOINT:** CL-11B rendered in chunks on GitHub Actions **and** locally;
      both packages in `out/`. → commit.

---

## Phase 1 acceptance (tick before declaring done)

- [x] `out/CL-11A` is a complete package (video, short, 3 thumbnails, captions,
      metadata, licences); CL-11B rendering in chunks. **Owner to watch both.**
- [x] No still lingers (every parallax-still has a camera move; lint enforces >20s
      stills need motion); captions are word-timestamp-driven (sync inherent); the
      nib sits on the stroke (calibrated hand.json); paper look consistent (shared
      Paper/theme/Daybreak across all templates).
- [x] Every image has a licence record (licences.json, lint-checked); lint passes on
      both; a deliberately broken script (hook removed / word count doubled / image
      without a licence) **fails lint** — verified. Lint also caught two real issues
      (over-long hooks; CL-11B under 35 min).
- [x] **A second same-style PD classic can ship with data only** (sources/<book>.txt
      + scripts/<CODE>.json + art queries.json; append names to pronounce.json). The
      tooling and templates are book-agnostic (hardcoded CL-11/1818 refs removed).
      **Still needs code:** Style-2 fiction "puppets" (no templates); the copyright
      lane's intended "AI stills" look (we don't do AI — compliant alternative is PD
      thematic art, which already works); KCSE set-text format tuning. See final report.

Done (checkpoints 1–7): skeleton+queue; schema+scripts; art+depth; hand+stroke;
narration+captions; 7 templates+Main/Short/Thumbnail; lint+chunked render+package+CI.

## Reporting

At the end of each session: what's done, what's next, any decision you should know
about, and anything needed from you (a photo retaken, a voice choice, an approval).
