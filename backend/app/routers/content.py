"""Read-only API over the academy's static JSON content files.

The frontend can continue to read the same files directly; this router simply
offers a typed, paginated HTTP interface for a future API-driven frontend.
User input never becomes a filesystem path — only an allowlisted set of
filenames is ever opened.
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from pathlib import Path
from typing import Any, TypeVar

from fastapi import APIRouter, HTTPException, Path as PathParam, Query, status

from app.config import get_settings
from app.schemas import (
    CVEOut,
    ChapterDetail,
    ChapterSummary,
    Paged,
    QuestionDomain,
    QuestionOut,
    ToolOut,
)

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/content", tags=["content"])

ALLOWED_FILES = {
    "chapters.json",
    "tools.json",
    "cves.json",
    "questions.json",
}

# backend/app/routers/content.py -> repository root is parents[3].
_DEFAULT_DATA_DIR = Path(__file__).resolve().parents[3] / "public" / "data"
DATA_DIR = Path(settings.content_data_dir).resolve() if settings.content_data_dir else _DEFAULT_DATA_DIR

T = TypeVar("T")


@lru_cache(maxsize=8)
def load_json(filename: str) -> tuple[dict[str, Any], ...]:
    """Load an allowlisted JSON file into immutable-ish dict records.

    Also re-checks that the resolved path stays inside DATA_DIR (defence in
    depth against path traversal). Safe to import from other routers.
    """
    if filename not in ALLOWED_FILES:
        raise ValueError(f"Content file {filename!r} is not allowlisted")
    path = (DATA_DIR / filename).resolve()
    if DATA_DIR != path.parent:
        raise ValueError("Resolved content path escaped the data directory")
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        logger.warning("Content file missing: %s", path)
        return ()
    except (OSError, json.JSONDecodeError) as exc:
        logger.error("Could not read content file %s: %s", filename, type(exc).__name__)
        return ()
    if not isinstance(payload, list):
        return ()
    return tuple(item for item in payload if isinstance(item, dict))


def _paginate(items: tuple[dict[str, Any], ...], limit: int, offset: int, model: type[T]) -> Paged[T]:
    page = items[offset : offset + limit]
    return Paged(
        items=[model.model_validate(item) for item in page],
        total=len(items),
        limit=limit,
        offset=offset,
    )


@router.get("/chapters", response_model=Paged[ChapterSummary], summary="List chapters")
async def list_chapters(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> Paged[ChapterSummary]:
    items = sorted(load_json("chapters.json"), key=lambda item: int(item.get("id", 0)))
    return _paginate(items, limit, offset, ChapterSummary)


@router.get("/chapters/{chapter_id}", response_model=ChapterDetail, summary="Get one chapter")
async def get_chapter(chapter_id: int = PathParam(ge=1)) -> ChapterDetail:
    for item in load_json("chapters.json"):
        if item.get("id") == chapter_id or item.get("number") == chapter_id:
            return ChapterDetail.model_validate(item)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chapter not found")


@router.get("/tools", response_model=Paged[ToolOut], summary="List tools encyclopedia entries")
async def list_tools(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> Paged[ToolOut]:
    items = load_json("tools.json")
    return _paginate(items, limit, offset, ToolOut)


@router.get("/cves", response_model=Paged[CVEOut], summary="List case-study CVEs")
async def list_cves(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> Paged[CVEOut]:
    items = load_json("cves.json")
    return _paginate(items, limit, offset, CVEOut)


@router.get("/questions", response_model=Paged[QuestionOut], summary="Query the question bank")
async def list_questions(
    domain: QuestionDomain | None = Query(default=None, description="Filter by knowledge domain."),
    limit: int = Query(default=20, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    include_answer: bool = Query(
        default=False, description="Include model answers (useful for review mode)."
    ),
) -> Paged[QuestionOut]:
    items = load_json("questions.json")
    if domain is not None:
        items = tuple(item for item in items if item.get("domain") == domain.value)
    if not include_answer:
        items = tuple({key: value for key, value in item.items() if key != "answer"} for item in items)
    return _paginate(items, limit, offset, QuestionOut)


@router.get("/chapters/{chapter_id}/context", summary="Compact context used by the AI tutor")
async def chapter_context(chapter_id: int) -> dict[str, Any]:
    """Small helper used by the tutor and useful for debugging grounding."""
    chapter = await get_chapter(chapter_id)
    return {
        "id": chapter.id,
        "title": chapter.title,
        "description": chapter.description,
        "tags": chapter.tags,
        "sections": [section.title for section in chapter.sections[:12]],
    }
