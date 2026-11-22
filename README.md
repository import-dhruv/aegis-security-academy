# AEGIS — Cybersecurity & Bug Bounty Academy

A complete, first-principles cybersecurity education platform: a structured curriculum, interactive knowledge databases, spaced-repetition assessments, hands-on labs, a professional bug-bounty workflow simulator and a source-grounded AI tutor.

> **Educational material only.** Every exploitation topic is bounded to local labs, synthetic targets, CTFs, or programs with explicit written authorization. See [`app/ethics/page.tsx`](app/ethics/page.tsx).

---

## What is included

| Area | Contents |
|---|---|
| Curriculum | 36 in-depth chapters (≈92,000 words) mapped to 19 core schools + 6 supporting tracks |
| Assessments | 1,000-question explanatory bank across 6 domains, 36 chapter mastery quizzes, 8 scenario assessments |
| Knowledge bases | 56 security tools, 15 real CVEs with NVD links, 28 research papers, 16 courses, 34 books, 554 glossary terms |
| Practice | 12 curated labs, 3 original browser mini-labs, 8 CTF challenges, 30 build projects |
| Professional | 7-stage bounty workflow, 12-step engagement simulator with a triage-scoring engine, 20 synthetic report case studies |
| AI | Three-mode offline grounded tutor (BEGINNER / ENGINEER / RESEARCHER) with a pluggable LLM backend |
| Progress | Local-first mastery tracking, 10-level skill tree, spaced repetition (SM-2 lite), analytics, notes and bookmarks |

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3100 (3000 is used by another local project)
```

Production build:

```bash
npm run build
npm start
```

Regenerate all content from the encyclopedia source (requires the source tree at `/home/dhruv2004/cybersecurity-encyclopedia`):

```bash
npm run content:build
```

Type checking:

```bash
npm run typecheck
```

The app is **local-first**: all progress lives in `localStorage`, so it works with no backend, database or API key. The FastAPI backend in [`backend/`](backend/) is an optional, production-minded scaffold for multi-user persistence and LLM tutor integration (see [`backend/README.md`](backend/README.md)).

---

## Architecture

```
cyber-academy/
├── app/                     # Next.js App Router pages
│   ├── learn/[slug]/        # Chapter reader with TOC, mastery quiz, notes
│   ├── schools/[slug]/      # School detail
│   ├── topics/[slug]/       # Topic hubs
│   ├── tools/               # Tools encyclopedia
│   ├── vulnerabilities/     # Real CVE database
│   ├── case-studies/        # Synthetic training reports
│   ├── research/            # Papers, courses, books, glossary
│   ├── labs/ ctf/ projects/ # Practice and portfolios
│   ├── flashcards/ assessments/  # Spaced repetition and testing
│   ├── simulator/           # Bug bounty workflow simulator
│   ├── tutor/               # AI tutor
│   └── ethics/              # Mandatory legal/ethical framework
├── components/              # App shell, providers, markdown, shared UI, command palette
├── lib/                     # Data hooks, types, progress engine, quiz helpers, nav config
├── scripts/build_content.py # Content pipeline (encyclopedia → static JSON/Markdown)
├── public/data/             # Generated JSON datasets
├── public/content/chapters/ # Generated Markdown chapters
└── backend/                 # FastAPI scaffold (optional)
```

### Design principles

- **Modular content:** every dataset is a standalone JSON file. Adding a school, chapter, tool, CVE, lab or paper requires no application restructuring.
- **Small client bundles:** long-form content is fetched on demand from `public/content`, not bundled into JavaScript.
- **Demonstrated progression:** a chapter counts as mastered only after an 80%+ assessment score. Levels unlock at 60% mastery of the preceding level.
- **Honest sourcing:** real CVEs link to NVD; papers link only to confidently derived sources; synthetic reports are labelled as such; tool commands carry a "verify against official docs" note.
- **Security-conscious defaults:** no secrets in the client, strict external-link attributes, security headers configured in `next.config.mjs`.

---

## Expanding the platform

1. **Content:** edit the source encyclopedia or the curated lists in `scripts/build_content.py`, then run `npm run content:build`.
2. **New school:** add an entry to `SCHOOLS` in the pipeline and map chapter IDs via `CHAPTER_META`.
3. **New tool / CVE / lab / project:** add a record to the corresponding dataset builder in `scripts/build_content.py`.
4. **New page:** create a route under `app/` and reuse `components/ui.tsx` and `components/providers.tsx`.
5. **Real AI:** implement `backend/app/routers/tutor.py` with a configured gateway and swap the offline engine in `lib/tutor.ts` for an API call behind a feature flag. The offline engine already performs lightweight keyword retrieval over the active chapter; a production RAG pipeline would add embeddings of all 36 chapters, a vector index, source-grounded generation and answer citations. Do not send learner notes or private data to a third-party model without explicit consent.

---

## Legal

General education, not legal advice. Laws vary by jurisdiction. Understand the rules that apply to you — including India's Information Technology Act 2000, the DPDP Act 2023, the UK Computer Misuse Act, the US CFAA and equivalents — before doing any security testing.
