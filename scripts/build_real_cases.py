#!/usr/bin/env python3
"""Build a curated set of 500 REAL, publicly disclosed bug bounty case studies.

Source: Hacker0x01/hackerone_disclosed_reports on Hugging Face — the public
dataset of disclosed HackerOne reports. Each entry keeps the researcher's own
write-up verbatim (lightly cleaned) plus structured metadata and a link to the
original disclosure. Nothing here is invented or synthetic.

Run: npm run content:real-cases
"""
from __future__ import annotations

import json
import re
import urllib.request
from collections import Counter
from pathlib import Path

import pandas as pd

HF_URL = (
    "https://huggingface.co/datasets/Hacker0x01/hackerone_disclosed_reports/"
    "resolve/main/data/train-00000-of-00001.parquet"
)
CACHE = Path("/tmp/opencode/hackerone_train.parquet")
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data" / "case-studies-real.json"

TARGET = 500
MAX_PER_PROGRAM = 12
MAX_PER_WEAKNESS = 55


SECRET_PATTERNS = [
    re.compile(r"(?:pk|sk)\.eyJ[A-Za-z0-9._-]{20,}"),  # Mapbox tokens
    re.compile(r"AKIA[0-9A-Z]{16}"),  # AWS access key IDs
    re.compile(r"gh[pousr]_[A-Za-z0-9]{20,}"),  # GitHub tokens
    re.compile(r"xox[baprs]-[A-Za-z0-9-]{10,}"),  # Slack tokens
    re.compile(r"AIza[0-9A-Za-z_-]{35}"),  # Google API keys
    re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"),  # JWTs
    re.compile(r"Bearer\s+[A-Za-z0-9._-]{20,}"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----", re.S),
]


def clean(text: str) -> str:
    text = text or ""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"█{2,}", "[redacted]", text)
    for pattern in SECRET_PATTERNS:
        text = pattern.sub("[redacted-secret]", text)
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    text = "".join(ch for ch in text if ch == "\n" or ch == "\t" or ord(ch) >= 32)
    return text.strip()[:12000]


def name_of(value) -> str:
    if isinstance(value, dict):
        return str(value.get("name") or value.get("handle") or "").strip()
    return ""


def program_of(team) -> tuple[str, str]:
    if not isinstance(team, dict):
        return "", ""
    profile = team.get("profile") or {}
    name = str(profile.get("name") or team.get("handle") or "").strip()
    return name, str(team.get("handle") or "").strip()


def main() -> None:
    if not CACHE.exists():
        print(f"downloading {HF_URL} …")
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(HF_URL, CACHE)

    df = pd.read_parquet(CACHE)
    df["detail_chars"] = df["vulnerability_information"].fillna("").str.len()
    pool = df[
        (df["has_bounty?"] == True)  # noqa: E712 - real paid bug bounty findings
        & (df["detail_chars"] > 800)
        & (df["detail_chars"] < 12000)
        & df["title"].notna()
    ].copy()
    pool["weakness_name"] = pool["weakness"].apply(name_of)
    pool = pool[pool["weakness_name"] != ""].copy()

    # Prefer detailed, well-documented, community-validated disclosures.
    pool["score"] = (
        pool["detail_chars"].clip(upper=6000) / 100.0
        + pool["vote_count"].fillna(0).clip(upper=300) / 6.0
    )
    pool = pool.sort_values("score", ascending=False)

    selected: list[dict] = []
    per_program: Counter = Counter()
    per_weakness: Counter = Counter()
    seen_titles: set[str] = set()

    for row in pool.itertuples(index=False):
        if len(selected) >= TARGET:
            break
        program, handle = program_of(row.team)
        weakness = row.weakness_name
        title_key = re.sub(r"\W+", "", str(row.title).lower())[:120]
        if not program or not title_key or title_key in seen_titles:
            continue
        if per_program[program] >= MAX_PER_PROGRAM:
            continue
        if per_weakness[weakness] >= MAX_PER_WEAKNESS:
            continue
        detail = clean(row.vulnerability_information)
        if len(detail) < 700:
            continue
        reporter = row.reporter
        reporter_name = ""
        if isinstance(reporter, dict):
            reporter_name = str(reporter.get("username") or "").strip()
        rid = int(row.id)
        selected.append({
            "id": f"h1-{rid}",
            "reportId": rid,
            "title": str(row.title).strip(),
            "program": program,
            "programHandle": handle,
            "weakness": weakness,
            "reporter": reporter_name,
            "votes": int(row.vote_count or 0),
            "disclosedAt": str(row.disclosed_at or "")[:10],
            "createdAt": str(row.created_at or "")[:10],
            "sourceUrl": f"https://hackerone.com/reports/{rid}",
            "source": "HackerOne public disclosure (Hacker0x01/hackerone_disclosed_reports)",
            "words": len(detail.split()),
            "detail": detail,
        })
        seen_titles.add(title_key)
        per_program[program] += 1
        per_weakness[weakness] += 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(selected, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {len(selected)} real disclosed case studies to {OUT.relative_to(ROOT)}")
    print(f"total words: {sum(c['words'] for c in selected):,}")
    print(f"programs: {len(per_program)} | weakness classes: {len(per_weakness)}")
    print("top programs:", per_program.most_common(8))


if __name__ == "__main__":
    main()
