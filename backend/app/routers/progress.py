"""Authenticated, user-scoped learning progress, notes and bookmarks."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_user
from app.db import get_session
from app.models import Bookmark, Note, Progress, QuizAttempt, User
from app.schemas import (
    ActivityIn,
    ActivityOut,
    ActivityStatus,
    BookmarkCreate,
    BookmarkOut,
    FlashcardReviewIn,
    FlashcardReviewOut,
    NoteCreate,
    NoteOut,
    ProgressOut,
    ProgressUpsert,
    QuizAttemptIn,
    QuizAttemptOut,
    StudyMinutesIn,
)

router = APIRouter(prefix="/progress", tags=["progress"])


async def _get_progress(session: AsyncSession, user_id: str) -> Progress:
    record = await session.scalar(select(Progress).where(Progress.user_id == user_id))
    if record is None:
        record = Progress(user_id=user_id)
        session.add(record)
        await session.flush()
    return record


def _touch(record: Progress) -> None:
    record.last_active = datetime.now(timezone.utc)


@router.get("", response_model=ProgressOut, summary="Get my progress")
async def get_progress(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProgressOut:
    record = await _get_progress(session, current_user.id)
    await session.commit()
    return ProgressOut.model_validate(record)


@router.put("", response_model=ProgressOut, summary="Replace selected progress fields")
async def put_progress(
    payload: ProgressUpsert,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProgressOut:
    record = await _get_progress(session, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True, mode="json").items():
        setattr(record, field, value)
    _touch(record)
    await session.commit()
    return ProgressOut.model_validate(record)


@router.post("/study-minutes", response_model=ProgressOut, summary="Log focused study time")
async def add_study_minutes(
    payload: StudyMinutesIn,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ProgressOut:
    record = await _get_progress(session, current_user.id)
    today = datetime.now(timezone.utc).date()
    previous = record.last_active.date() if record.last_active else None
    if previous == today:
        pass
    elif previous == today - timedelta(days=1):
        record.streak = (record.streak or 0) + 1
    else:
        record.streak = 1
    record.study_minutes = (record.study_minutes or 0) + payload.minutes
    _touch(record)
    await session.commit()
    return ProgressOut.model_validate(record)


@router.post(
    "/chapter/{chapter_id}/quiz",
    response_model=QuizAttemptOut,
    status_code=status.HTTP_201_CREATED,
    summary="Record a chapter quiz attempt",
)
async def record_quiz(
    chapter_id: int,
    payload: QuizAttemptIn,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> QuizAttemptOut:
    attempt = QuizAttempt(
        user_id=current_user.id,
        chapter_id=chapter_id,
        score=payload.score,
        answers=payload.answers,
    )
    session.add(attempt)

    record = await _get_progress(session, current_user.id)
    scores: dict[str, Any] = dict(record.quiz_scores or {})
    key = str(chapter_id)
    scores[key] = max(int(scores.get(key, 0)), payload.score)
    record.quiz_scores = scores

    completed = list(record.completed_chapters or [])
    if payload.score >= 80 and chapter_id not in completed:
        completed.append(chapter_id)
        record.completed_chapters = completed
    _touch(record)

    await session.commit()
    return QuizAttemptOut.model_validate(attempt)


@router.get("/flashcards/{card_id}", response_model=FlashcardReviewOut, summary="Get a flashcard review")
async def get_flashcard(
    card_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> FlashcardReviewOut:
    record = await _get_progress(session, current_user.id)
    await session.commit()
    return FlashcardReviewOut(
        card_id=card_id, review=(record.flashcard_reviews or {}).get(card_id)
    )


@router.put("/flashcards/{card_id}", response_model=FlashcardReviewOut, summary="Save a flashcard review")
async def put_flashcard(
    card_id: str,
    payload: FlashcardReviewIn,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> FlashcardReviewOut:
    record = await _get_progress(session, current_user.id)
    reviews: dict[str, Any] = dict(record.flashcard_reviews or {})
    review = payload.model_dump(mode="json")
    review["reviewed_at"] = datetime.now(timezone.utc).isoformat()
    reviews[card_id] = review
    record.flashcard_reviews = reviews
    _touch(record)
    await session.commit()
    return FlashcardReviewOut(card_id=card_id, review=review)


@router.post("/labs/{lab_id}", response_model=ActivityOut, summary="Mark a lab in progress/completed")
async def set_lab(
    lab_id: str,
    payload: ActivityIn,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ActivityOut:
    record = await _get_progress(session, current_user.id)
    labs = list(record.completed_labs or [])
    state = payload.model_dump(mode="json")
    if payload.status == ActivityStatus.not_started:
        labs = [item for item in labs if item != lab_id]
        state = None
    elif lab_id not in labs:
        labs.append(lab_id)
    record.completed_labs = labs
    _touch(record)
    await session.commit()
    return ActivityOut(item_id=lab_id, state=state)


@router.delete("/labs/{lab_id}", response_model=ActivityOut, summary="Clear lab progress")
async def delete_lab(
    lab_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ActivityOut:
    record = await _get_progress(session, current_user.id)
    labs = [item for item in (record.completed_labs or []) if item != lab_id]
    record.completed_labs = labs
    await session.commit()
    return ActivityOut(item_id=lab_id, state=None)


@router.post("/challenges/{challenge_id}", response_model=ActivityOut, summary="Save challenge progress")
async def set_challenge(
    challenge_id: str,
    payload: ActivityIn,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ActivityOut:
    record = await _get_progress(session, current_user.id)
    challenges: dict[str, Any] = dict(record.challenges or {})
    state = payload.model_dump(mode="json")
    if payload.status == ActivityStatus.not_started:
        challenges.pop(challenge_id, None)
        state = None
    else:
        challenges[challenge_id] = state
    record.challenges = challenges
    _touch(record)
    await session.commit()
    return ActivityOut(item_id=challenge_id, state=state)


@router.delete("/challenges/{challenge_id}", response_model=ActivityOut, summary="Clear challenge progress")
async def delete_challenge(
    challenge_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> ActivityOut:
    record = await _get_progress(session, current_user.id)
    challenges: dict[str, Any] = dict(record.challenges or {})
    challenges.pop(challenge_id, None)
    record.challenges = challenges
    await session.commit()
    return ActivityOut(item_id=challenge_id, state=None)


# ---------------------------------------------------------------------------
# Notes and bookmarks (the localStorage equivalents)
# ---------------------------------------------------------------------------
@router.get("/notes", response_model=list[NoteOut], summary="List my notes")
async def list_notes(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[NoteOut]:
    notes = (
        await session.scalars(
            select(Note).where(Note.user_id == current_user.id).order_by(Note.created_at.desc())
        )
    ).all()
    return [NoteOut.model_validate(note) for note in notes]


@router.post(
    "/notes",
    response_model=NoteOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a note",
)
async def create_note(
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> NoteOut:
    note = Note(user_id=current_user.id, body=payload.body.strip(), ref=payload.ref)
    session.add(note)
    await session.commit()
    return NoteOut.model_validate(note)


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a note")
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Response:
    note = await session.get(Note, note_id)
    if note is None or note.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Note not found")
    await session.delete(note)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/bookmarks", response_model=list[BookmarkOut], summary="List my bookmarks")
async def list_bookmarks(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[BookmarkOut]:
    bookmarks = (
        await session.scalars(
            select(Bookmark)
            .where(Bookmark.user_id == current_user.id)
            .order_by(Bookmark.created_at.desc())
        )
    ).all()
    return [BookmarkOut.model_validate(bookmark) for bookmark in bookmarks]


@router.post(
    "/bookmarks",
    response_model=BookmarkOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a bookmark",
)
async def create_bookmark(
    payload: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> BookmarkOut:
    existing = await session.scalar(
        select(Bookmark).where(
            Bookmark.user_id == current_user.id, Bookmark.ref == payload.ref
        )
    )
    if existing:
        return BookmarkOut.model_validate(existing)
    bookmark = Bookmark(user_id=current_user.id, ref=payload.ref, title=payload.title)
    session.add(bookmark)
    await session.commit()
    return BookmarkOut.model_validate(bookmark)


@router.delete(
    "/bookmarks/{ref:path}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a bookmark by reference",
)
async def delete_bookmark(
    ref: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> Response:
    bookmark = await session.scalar(
        select(Bookmark).where(Bookmark.user_id == current_user.id, Bookmark.ref == ref)
    )
    if bookmark is None:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    await session.delete(bookmark)
    await session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
