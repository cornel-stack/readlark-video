#!/usr/bin/env python3
"""Validate a video script JSON against schema/script.schema.json.

Usage:  python tools/validate_script.py scripts/CL-11A.json
This is schema-shape validation only. The time-based lint rules (word/minute
budgets, title-card within 20s, no still >20s without motion) live in
tools/lint.py because they need the rendered audio.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = ROOT / "schema" / "script.schema.json"


def validate(path: Path) -> list[str]:
    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    data = json.loads(path.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)
    errors = []
    for e in sorted(validator.iter_errors(data), key=lambda e: list(e.path)):
        loc = "/".join(str(p) for p in e.path) or "(root)"
        errors.append(f"{loc}: {e.message}")

    # Cross-reference checks the schema can't express:
    ids = [s["id"] for s in data.get("scenes", [])]
    dup = {i for i in ids if ids.count(i) > 1}
    if dup:
        errors.append(f"duplicate scene ids: {sorted(dup)}")
    idset = set(ids)
    for ch in data.get("chapters", []):
        if ch.get("first_scene") not in idset:
            errors.append(f"chapter '{ch.get('title')}' first_scene '{ch.get('first_scene')}' is not a scene id")
    return errors


def main() -> int:
    if len(sys.argv) != 2:
        sys.exit("usage: validate_script.py <script.json>")
    path = Path(sys.argv[1])
    errors = validate(path)
    if errors:
        print(f"INVALID: {path}", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1
    print(f"valid: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
