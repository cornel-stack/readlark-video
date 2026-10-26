# ReadLark video factory — one-command pipeline stages.
# Usage:  make ingest
#         make art CODE=CL-11A
#         make all CODE=CL-11A
#
# Each code-scoped target takes CODE=<video code> (e.g. CL-11A, CL-11B).
# Stages are added checkpoint by checkpoint; targets for not-yet-built tools are
# marked (pending) and will run as those tools land.

PY := .venv/bin/python
REMOTION := remotion
.DEFAULT_GOAL := help

.PHONY: help ingest hand art audio lint render package all preview check-code

help:
	@echo "ReadLark pipeline targets:"
	@echo "  make ingest              backlog xlsx -> backlog/videos.json (138 entries)"
	@echo "  make hand                cut out hand photos -> assets/hand/cutouts  (Checkpoint 4)"
	@echo "  make art CODE=CL-11A     fetch PD plates + depth layers              (Checkpoint 3)"
	@echo "  make audio CODE=CL-11A   edge-tts narration + whisper captions       (Checkpoint 5)"
	@echo "  make lint CODE=CL-11A    enforce the lint gate                        (Checkpoint 7)"
	@echo "  make render CODE=CL-11A  render Main/Short/Thumbnail                  (Checkpoint 6)"
	@echo "  make package CODE=CL-11A assemble out/<CODE>/                         (Checkpoint 7)"
	@echo "  make all CODE=CL-11A     art -> audio -> lint -> render -> package"
	@echo "  make preview             render the Checkpoint-1 placeholder (10s)"

check-code:
	@test -n "$(CODE)" || (echo "ERROR: set CODE=<video code>, e.g. make $(MAKECMDGOALS) CODE=CL-11A" && exit 1)

ingest:
	$(PY) tools/ingest.py

hand:
	$(PY) tools/hand_cutout.py   # (pending: Checkpoint 4)

art: check-code
	$(PY) tools/art_fetch.py --code $(CODE)      # (pending: Checkpoint 3)
	$(PY) tools/depth_layers.py --code $(CODE)   # (pending: Checkpoint 3)

audio: check-code
	$(PY) tools/audio.py --code $(CODE)          # (pending: Checkpoint 5)

lint: check-code
	$(PY) tools/lint.py --code $(CODE)           # (pending: Checkpoint 7)

render: check-code
	cd $(REMOTION) && npx remotion render src/index.ts Main ../out/$(CODE)/video.mp4 \
		--props='{"code":"$(CODE)"}'             # (pending: Checkpoint 6)

package: check-code
	$(PY) tools/package.py --code $(CODE)        # (pending: Checkpoint 7)

all: check-code art audio lint render package

preview:
	cd $(REMOTION) && npx remotion render src/index.ts Placeholder ../out/_placeholder.mp4
