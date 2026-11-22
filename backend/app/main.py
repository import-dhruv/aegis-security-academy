"""AEGIS Academy API entrypoint.

Run locally with:  uvicorn app.main:app --reload
"""

from __future__ import annotations

import logging
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import get_settings
from app.db import check_db, dispose_engine, init_db
from app.routers import auth as auth_router
from app.routers import content as content_router
from app.routers import progress as progress_router
from app.routers import tutor as tutor_router
from app.schemas import HealthOut
from app.security import check_redis, scrub_secrets

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("aegis.api")
settings = get_settings()

API_TITLE = "AEGIS Academy API"
API_DESCRIPTION = (
    "Backend scaffold for the AEGIS Cybersecurity & Bug Bounty Academy. "
    "Accounts, persisted learning progress, read-only content and a grounded AI tutor. "
    "Educational use only — authorization is required before testing any real system."
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create schema on startup and release connections on shutdown."""
    logger.info("Starting %s v%s (environment=%s)", API_TITLE, __version__, settings.environment)
    try:
        await init_db()
        logger.info("Database schema is ready")
    except Exception as exc:
        # Startup must not hard-fail: /healthz reports the real state to operators.
        logger.error("Database initialization failed: %s", scrub_secrets(exc))

    try:
        yield
    finally:
        await dispose_engine()
        logger.info("AEGIS API stopped")


app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=__version__,
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# CORS is driven by CORS_ORIGINS (comma-separated). Credentials are allowed for
# same-site browser clients; tighten allow_methods for production if desired.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
)

SECURITY_HEADERS: dict[str, str] = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
}


@app.middleware("http")
async def request_context(request: Request, call_next):
    """Attach a request id, set security headers and log without secrets/bodies."""
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    started = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception(
            "unhandled_error request_id=%s method=%s path=%s",
            request_id,
            request.method,
            scrub_secrets(request.url.path),
        )
        raise

    for header, value in SECURITY_HEADERS.items():
        response.headers.setdefault(header, value)
    if settings.is_production:
        response.headers.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
        )
    response.headers["X-Request-ID"] = request_id

    elapsed_ms = (time.perf_counter() - started) * 1000
    logger.info(
        "request request_id=%s method=%s path=%s query=%s status=%s duration_ms=%.1f",
        request_id,
        request.method,
        scrub_secrets(request.url.path),
        scrub_secrets(request.url.query),
        response.status_code,
        elapsed_ms,
    )
    return response


@app.get("/", tags=["meta"], summary="API description")
async def root() -> dict[str, Any]:
    return {
        "name": API_TITLE,
        "version": __version__,
        "description": API_DESCRIPTION,
        "api_prefix": settings.api_prefix,
        "environment": settings.environment,
        "docs_url": "/docs" if not settings.is_production else None,
        "modules": {
            "auth": f"{settings.api_prefix}/auth",
            "progress": f"{settings.api_prefix}/progress",
            "content": f"{settings.api_prefix}/content",
            "tutor": f"{settings.api_prefix}/tutor",
        },
        "health": "/healthz",
        "notice": "Educational knowledge is not permission to test real systems without authorization.",
    }


@app.get("/healthz", response_model=HealthOut, tags=["meta"], summary="Liveness and dependency status")
async def healthz() -> HealthOut:
    database_ok = await check_db()
    redis_ok = await check_redis()
    status_value = "ok" if database_ok else "degraded"
    if not database_ok and not redis_ok and settings.redis_url:
        status_value = "unavailable"
    return HealthOut(
        status=status_value,
        version=__version__,
        environment=settings.environment,
        dependencies={"database": database_ok, "redis": redis_ok},
    )


app.include_router(auth_router.router, prefix=settings.api_prefix)
app.include_router(progress_router.router, prefix=settings.api_prefix)
app.include_router(content_router.router, prefix=settings.api_prefix)
app.include_router(tutor_router.router, prefix=settings.api_prefix)


def run() -> None:  # console script target (see pyproject.toml)
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=not settings.is_production,
        log_level="info",
    )


if __name__ == "__main__":  # pragma: no cover
    run()
