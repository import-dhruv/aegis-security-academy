#!/usr/bin/env python3
"""Compile the 50-module curricula into JSON consumed by the Next.js app.

Source of truth: cybersecurity-encyclopedia/build/modules/<slug>.md
Each module block starts with a line `===MODULE===`, followed by uppercase
KEY: value header lines, a `---` separator, then GFM markdown content.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "modules"
DATA = ROOT / "public" / "data" / "modules"

TOPICS = {
    "bug-bounty": "Bug Bounty Academy",
    "web-security": "Web Security",
    "networking": "Networking",
    "linux-windows": "Linux & Windows",
    "cloud-security": "Cloud Security",
    "mobile-security": "Mobile Security",
    "reverse-engineering": "Reverse Engineering",
    "ai-security": "AI Security",
    "field-guide": "Practical Bug Bounty Field Guide",
}


def split_list(value: str) -> list[str]:
    return [item.strip() for item in value.split("|") if item.strip()]


def parse_sources(value: str) -> list[dict]:
    if not value or value.strip().lower() in {"none", "n/a", "-"}:
        return []
    out: list[dict] = []
    for entry in value.split(";"):
        entry = entry.strip()
        if not entry:
            continue
        if "|" in entry:
            label, url = entry.split("|", 1)
        else:
            label, url = entry, entry
        label, url = label.strip(), url.strip()
        if url.startswith("http"):
            out.append({"label": label or url, "url": url})
    return out


def parse_file(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    blocks = re.split(r"(?m)^===MODULE===\s*$", text)
    modules: list[dict] = []
    for block in blocks:
        if not block.strip():
            continue
        lines = block.strip("\n").splitlines()
        try:
            sep = next(i for i, line in enumerate(lines) if line.strip() == "---")
        except StopIteration:
            print(f"  ! skipping block without --- separator in {path.name}")
            continue
        headers: dict[str, str] = {}
        for line in lines[:sep]:
            if ":" in line:
                key, value = line.split(":", 1)
                headers[key.strip()] = value.strip()
        if "TITLE" not in headers:
            continue
        body = "\n".join(lines[sep + 1:]).strip()
        n = len(modules) + 1
        minutes = 30
        try:
            minutes = int(re.search(r"\d+", headers.get("MINUTES", "30")).group())
        except (AttributeError, ValueError):
            pass
        modules.append({
            "id": f"{path.stem}-{n:02d}",
            "topic": path.stem,
            "number": n,
            "title": headers["TITLE"],
            "level": headers.get("LEVEL", "Intermediate"),
            "minutes": minutes,
            "summary": headers.get("SUMMARY", ""),
            "objectives": split_list(headers.get("OBJECTIVES", "")),
            "takeaways": split_list(headers.get("TAKEAWAYS", "")),
            "practice": headers.get("PRACTICE", ""),
            "sources": parse_sources(headers.get("SOURCES", "")),
            "content": body,
        })
    return modules


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)
    index: list[dict] = []
    total = 0
    for slug, title in TOPICS.items():
        path = SRC / f"{slug}.md"
        if not path.exists():
            print(f"  ! missing source: {path}")
            continue
        modules = parse_file(path)
        (DATA / f"{slug}.json").write_text(
            json.dumps(modules, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        words = sum(len(m["content"].split()) for m in modules)
        cited = sum(1 for m in modules if m["sources"])
        index.append({
            "slug": slug,
            "title": title,
            "count": len(modules),
            "words": words,
            "citedModules": cited,
        })
        total += len(modules)
        flag = "OK" if len(modules) == 50 else "INCOMPLETE"
        print(f"  {slug:20} {len(modules):>3} modules | {words:>6} words | {cited:>2} cited | {flag}")
    (DATA / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"total modules: {total}")


if __name__ == "__main__":
    main()
