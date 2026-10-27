#!/usr/bin/env python3
"""Generate backlog/PRODUCTION.md — the long-video production tracker.

Reads backlog/videos.json (the 138 uploads), marks each 📝 scripted if scripts/<code>.json
exists and ✅ rendered if its code is listed in backlog/rendered.json, and writes a
grouped, progress-summarised Markdown tracker.

Run:  python tools/gen_backlog_md.py   (re-run any time; it's derived)
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> int:
    videos = json.loads((ROOT / "backlog" / "videos.json").read_text(encoding="utf-8"))
    rendered = set()
    rp = ROOT / "backlog" / "rendered.json"
    if rp.exists():
        rendered = set(json.loads(rp.read_text()))

    def status(v):
        if v["code"] in rendered:
            return "✅ rendered"
        if (ROOT / "scripts" / f"{v['code']}.json").exists():
            return "📝 scripted"
        return "⬜ planned"

    n = len(videos)
    done = sum(1 for v in videos if v["code"] in rendered)
    scripted = sum(1 for v in videos if status(v) == "📝 scripted")
    bar = "█" * round(20 * done / n) + "░" * (20 - round(20 * done / n))

    lines = [
        "# ReadLark — long-video production tracker",
        "",
        f"Derived from `backlog/videos.json` — regenerate with `python tools/gen_backlog_md.py`.",
        f"Mark a video rendered by adding its code to `backlog/rendered.json`.",
        "",
        f"**Progress: {done}/{n} rendered**  `{bar}`  ·  {scripted} scripted, awaiting render  ·  {n - done - scripted} planned",
        "",
        "Status: ⬜ planned (no script) · 📝 scripted · ✅ rendered",
        "",
    ]
    # group by phase
    phases: dict = {}
    for v in videos:
        phases.setdefault(v.get("phase") or 0, []).append(v)
    for ph in sorted(phases):
        rows = phases[ph]
        lines.append(f"## Phase {ph}  ({len(rows)} uploads)")
        lines.append("")
        lines.append("| Code | Book | Format | Lane | Status |")
        lines.append("|------|------|--------|------|--------|")
        for v in rows:
            lines.append(f"| {v['code']} | {v['book']} | {v['format']} | {v['lane']} | {status(v)} |")
        lines.append("")

    (ROOT / "backlog" / "PRODUCTION.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"wrote backlog/PRODUCTION.md  ({done} rendered, {scripted} scripted, {n} total)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
