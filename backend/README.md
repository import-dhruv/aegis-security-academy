# AEGIS Academy API (backend scaffold)

A production-minded **FastAPI** scaffold that can eventually replace the frontend's
`localStorage` persistence and power the grounded AI tutor. The frontend works
fully without this service; this API is additive.

> **Status: scaffold, not production-ready.** Authentication, rate limiting and
> deployment hardening are intentionally minimal. See
> [Security notes](#security-notes) before exposing this to the internet.

## Stack

Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, pydantic-settings,
PyJWT, passlib/bcrypt, asyncpg (PostgreSQL), aiosqlite (local fallback), Redis
(optional, for rate limiting) and httpx (tutor calls).

## Run locally

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# SQLite fallback is used automatically when DATABASE_URL is unset
uvicorn app.main:app --reload --port 8000
```

Or use the console script after install: `aegis-api`.

Open <http://localhost:8000/docs> for interactive OpenAPI docs and
<http://localhost:8000/healthz> for dependency status.

With Docker from the repository root:

```bash
docker compose up --build
```

## Environment variables

Copy `.env.example` (repo root) to `.env` and adjust. All settings are read in
`app/config.py` via pydantic-settings.

| Variable | Default | Purpose |
| --- | --- | --- |
| `ENVIRONMENT` | `development` | `production` enables stricter secret/CORS validation and disables docs. |
| `DATABASE_URL` | *(unset → SQLite)* | e.g. `postgresql+asyncpg://aegis:aegis@postgres:5432/aegis`. |
| `REDIS_URL` | *(unset)* | Enables distributed rate limiting; otherwise an in-memory limiter warns on startup. |
| `SECRET_KEY` | dev placeholder | HS256 signing key. **Must be ≥32 chars in production.** |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated browser origins. Wildcards rejected in production. |
| `AI_GATEWAY_URL` | *(unset)* | OpenAI-compatible base URL (e.g. an AI Gateway endpoint). |
| `OPENAI_API_KEY` | *(unset)* | Model credential. Never returned by any endpoint. |
| `TUTOR_MODEL` | `gpt-4o-mini` | Model id used for tutor completions. |
| `HOST` / `PORT` | `0.0.0.0` / `8000` | Bind address for the `aegis-api` script. |
| `CONTENT_DATA_DIR` | *(auto)* | Override path to the static JSON data directory. |
| `RATE_LIMIT_PER_MINUTE` | `60` | Default fixed-window limit. |

Generate a production key with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

## API overview

Base prefix: `/api/v1`

| Group | Endpoints |
| --- | --- |
| meta | `GET /`, `GET /healthz` |
| auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me` |
| progress | `GET/PUT /progress`, `POST /progress/study-minutes`, `POST /progress/chapter/{id}/quiz`, `GET/PUT /progress/flashcards/{id}`, `POST/DELETE /progress/labs/{id}`, `POST/DELETE /progress/challenges/{id}`, `GET/POST/DELETE /progress/notes`, `GET/POST/DELETE /progress/bookmarks` |
| content | `GET /content/chapters`, `/content/chapters/{id}`, `/content/tools`, `/content/cves`, `/content/questions?domain=&limit=&offset=&include_answer=` |
| tutor | `POST /tutor/chat`, `GET /tutor/modes` |

Every `/progress` route requires `Authorization: Bearer <access_token>` and scopes
all rows to the current user — there is no way to read another user's data by
changing an id. Content endpoints are read-only and paginated (max 200 items).
Question answers are omitted unless `include_answer=true`.

### AI tutor

`POST /tutor/chat` accepts:

```json
{
  "mode": "beginner",
  "message": "Explain the same-origin policy with an analogy.",
  "chapter_id": 7,
  "selection": "optional highlighted text from the page",
  "history": []
}
```

Modes are `beginner`, `engineer` and `researcher`, matching the frontend's three
explanation styles. When no model is configured (or the model call fails), the
response is clearly flagged `"offline": true` and contains a first-principles
scaffold. Responses never contain API keys, URLs or headers. Inputs are bounded
(character cap, max 12 history turns, 700 output tokens, 20s timeout) and the
system prompt enforces grounding with citations plus refusal of unauthorized
exploitation requests. If an access token is supplied, the conversation is
persisted; otherwise the endpoint still works anonymously.

## Migration path: localStorage → API

1. **Keep local-first as the default.** The frontend providers already own the
   progress shape; add an adapter with the same interface (e.g. `getProgress`,
   `saveProgress`, `addNote`).
2. **Add accounts.** Call `/auth/register` or `/auth/login`, store the access
   token in memory and the refresh token in an `httpOnly`, `Secure`, `SameSite`
   cookie set by a thin BFF (do not put long-lived tokens in `localStorage`).
3. **One-time import.** On first authenticated load, `PUT /progress` with the
   existing localStorage blob, then mark the import complete in localStorage so
   it is not repeated.
4. **Read-through writes.** After each local mutation, enqueue an idempotent
   PATCH/PUT to the API; reconcile with `GET /progress` on login and on reconnect.
   Use a `updated_at`/version field to resolve conflicts (last-write-wins is a
   reasonable first version).
5. **Replace static fetch last.** Switch the content hooks from `/data/*.json`
   to `/api/v1/content/*` only after the API is verified in staging; both sources
   serve the same files.
6. **Back up before cutover.** Export each user's localStorage blob as JSON and
   keep it until the API import is verified.

## Database migrations

`init_db()` currently calls `Base.metadata.create_all()` on startup for
developer convenience. Before production, add Alembic:

```bash
alembic init migrations
# set sqlalchemy.url from settings, then:
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

Then remove or gate the `create_all()` call in `app/db.py` behind
`ENVIRONMENT=development`.

## Security notes

- **Change `SECRET_KEY`** for every environment; production refuses keys shorter
  than 32 characters. Rotate on suspicion of compromise (this invalidates tokens).
- **Tighten CORS** to an explicit origin list; never use `*` with credentials.
- **Add rate limiting** to `/login`, `/register` and `/refresh`. The scaffold has
  a Redis-backed limiter helper in `app/security.py`; it is not yet wired to those
  routes. In-memory limiting is process-local and must not be used in production.
- **Add account lockout/backoff, email verification, password reset and MFA** for
  privileged roles — see TODOs in `app/auth.py`.
- **Terminate TLS** at a reverse proxy / platform edge and enforce HSTS
  (already emitted in production mode). Never send tokens over plain HTTP.
- **Back up PostgreSQL** with point-in-time recovery; test restores. Refresh
  tokens are stored hashed, but the database also contains personal notes.
- **Restrict the model credential** to the tutor's gateway/provider, set spend
  limits, and scrub logs (helpers in `app/security.py`) — no key is ever returned
  by an endpoint.
- **Keep the educational boundary:** the tutor refuses unauthorized exploitation
  guidance; do not weaken its system prompt without a review.
