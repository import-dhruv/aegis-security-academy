#!/usr/bin/env python3
"""Compile guided practice sessions into JSON for the Next.js app.

Source: content/practice-sessions/sessions.md
Run: npm run content:practice
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "practice-sessions" / "sessions.md"
OUT = ROOT / "public" / "data" / "practice-sessions.json"


def split_list(value: str) -> list[str]:
    return [v.strip() for v in value.split("|") if v.strip()]


def parse() -> list[dict]:
    text = SRC.read_text(encoding="utf-8")
    blocks = re.split(r"(?m)^===SESSION===\s*$", text)
    out: list[dict] = []
    for block in blocks:
        if not block.strip():
            continue
        lines = block.strip("\n").splitlines()
        try:
            sep = next(i for i, line in enumerate(lines) if line.strip() == "---")
        except StopIteration:
            continue
        headers: dict[str, str] = {}
        for line in lines[:sep]:
            if ":" in line:
                key, value = line.split(":", 1)
                headers[key.strip()] = value.strip()
        if "TITLE" not in headers:
            continue
        try:
            hours = int(re.search(r"\d+", headers.get("HOURS", "3")).group())
        except (AttributeError, ValueError):
            hours = 3
        out.append({
            "id": f"session-{len(out) + 1:02d}",
            "number": len(out) + 1,
            "title": headers["TITLE"],
            "track": headers.get("TRACK", "General"),
            "level": headers.get("LEVEL", "Intermediate"),
            "hours": hours,
            "goal": headers.get("GOAL", ""),
            "objectives": split_list(headers.get("OBJECTIVES", "")),
            "environment": split_list(headers.get("ENVIRONMENT", "")),
            "deliverables": split_list(headers.get("DELIVERABLES", "")),
            "content": "\n".join(lines[sep + 1:]).strip(),
        })
    return out


def main() -> None:
    sessions = parse()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(sessions, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(sessions)} practice sessions to {OUT.relative_to(ROOT)}")
    for s in sessions:
        print(f"  {s['id']} [{s['track']}] {s['title']} ({s['hours']}h, {len(s['content'].split())} words)")


if __name__ == "__main__":
    main()
