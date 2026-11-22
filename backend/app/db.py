"""Async SQLAlchemy 2.0 engine, session factory and schema bootstrap.

Local development uses SQLite via aiosqlite when ``DATABASE_URL`` is unset;
production should point at PostgreSQL via asyncpg.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def _engine_settings() -> tuple[str, dict[str, Any]]:
    raw = (settings.database_url or "").strip()
    if raw:
        # Normalise common SQLAlchemy URL spellings to the async driver.
        if raw.startswith("postgres://"):
            raw = "postgresql+asyncpg://" + raw[len("postgres://") :]
        elif raw.startswith("postgresql://"):
            raw = "postgresql+asyncpg://" + raw[len("postgresql://") :]
        return raw, {"pool_pre_ping": True}

    # Local-first fallback: a file-backed DB next to the backend package.
    return "sqlite+aiosqlite:///./aegis.db", {
        "connect_args": {"check_same_thread": False},
    }


DATABASE_URL, _ENGINE_KWARGS = _engine_settings()
IS_SQLITE = DATABASE_URL.startswith("sqlite")

engine = create_async_engine(DATABASE_URL, echo=False, **_ENGINE_KWARGS)
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_session() -> AsyncIterator[AsyncSession]:
    """FastAPI dependency yielding a transaction-scoped async session."""
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create tables on startup.

    This is convenient for local development and demos. Production deployments
    should use Alembic migrations instead (see README); keep this call guarded
    by ENVIRONMENT in that case.
    """
    # Imported lazily to register all mappers without creating an import cycle.
    from app import models  # noqa: F401

    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


async def check_db() -> bool:
    """Best-effort database liveness probe for /healthz."""
    try:
        async with SessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


async def dispose_engine() -> None:
    await engine.dispose()
