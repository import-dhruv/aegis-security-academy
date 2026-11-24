# Real bug bounty case studies — provenance

`public/data/case-studies-real.json` contains 500 **real, publicly disclosed** bug bounty reports.

**Source:** [Hacker0x01/hackerone_disclosed_reports](https://huggingface.co/datasets/Hacker0x01/hackerone_disclosed_reports) — a public dataset released by HackerOne containing disclosed HackerOne reports, including the researcher's `vulnerability_information` write-up, program, weakness classification, dates and vote count.

**Selection criteria** (implemented in `scripts/build_real_cases.py`):
- Paid bounty reports (`has_bounty? = true`) only
- Substantive write-ups: 800–12,000 characters
- A named weakness classification and a named program
- Ranked by write-up depth plus community votes
- Diversity caps: at most 12 cases per program and 55 per weakness class; duplicate titles removed

**Handling:** write-ups are reproduced verbatim except for formatting cleanup (line endings, excessive blank lines, control characters). Redactions already present in the public disclosure appear as `[redacted]`. Every record includes `sourceUrl` pointing to `https://hackerone.com/reports/<id>` so readers can verify the original.

**No synthetic content** is included in this dataset. The separate `/case-studies` page contains clearly-labelled synthetic training reports.

Regenerate with `npm run content:real-cases` (downloads the public parquet to a local cache).
