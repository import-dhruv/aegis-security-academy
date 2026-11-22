"""Pydantic v2 request and response contracts for the AEGIS API."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", json_schema_extra={
        "example": {
            "email": "student@example.com",
            "display_name": "Ada",
            "password": "a-strong-passphrase-2026",
        }
    })

    email: str = Field(
        min_length=3, max_length=320, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        description="A valid email address.", examples=["student@example.com"],
    )
    display_name: str = Field(
        min_length=1, max_length=120, examples=["Ada"],
    )
    password: str = Field(
        min_length=10, max_length=128,
        description="At least 10 characters; bcrypt only uses the first 72 bytes.",
        examples=["a-strong-passphrase-2026"],
    )


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", json_schema_extra={
        "example": {"email": "student@example.com", "password": "a-strong-passphrase-2026"}
    })

    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refresh_token: str = Field(min_length=20, max_length=4096)


class UserOut(ORMModel):
    id: str
    email: str
    display_name: str
    role: str
    created_at: datetime


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int = Field(description="Access-token lifetime in seconds.")


class AuthResponse(TokenPair):
    user: UserOut


# ---------------------------------------------------------------------------
# Progress
# ---------------------------------------------------------------------------
class ProgressUpsert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    completed_chapters: list[int] | None = Field(default=None, max_length=1000)
    quiz_scores: dict[str, int] | None = Field(default=None, examples=[{"1": 92, "2": 80}])
    flashcard_reviews: dict[str, dict[str, Any]] | None = None
    study_minutes: int | None = Field(default=None, ge=0, le=10_000_000)
    streak: int | None = Field(default=None, ge=0, le=100_000)
    last_active: datetime | None = None

    @field_validator("quiz_scores")
    @classmethod
    def _scores_in_range(cls, value: dict[str, int] | None) -> dict[str, int] | None:
        if value is None:
            return None
        for key, score in value.items():
            if not 0 <= score <= 100:
                raise ValueError(f"quiz score for {key!r} must be between 0 and 100")
        return value


class ProgressOut(ORMModel):
    id: str
    user_id: str
    completed_chapters: list[int]
    quiz_scores: dict[str, int]
    flashcard_reviews: dict[str, dict[str, Any]]
    completed_labs: list[str]
    challenges: dict[str, dict[str, Any]]
    study_minutes: int
    streak: int
    last_active: datetime
    updated_at: datetime


class StudyMinutesIn(BaseModel):
    model_config = ConfigDict(extra="forbid", json_schema_extra={"example": {"minutes": 25}})

    minutes: int = Field(ge=1, le=1440, examples=[25])


class QuizAttemptIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    score: int = Field(ge=0, le=100, examples=[90])
    answers: dict[str, bool] = Field(default_factory=dict)


class QuizAttemptOut(ORMModel):
    id: str
    user_id: str
    chapter_id: int
    score: int
    answers: dict[str, bool]
    created_at: datetime


class FlashcardReviewIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    correct: bool
    rating: int | None = Field(default=None, ge=0, le=5)
    interval_days: int | None = Field(default=None, ge=0, le=3650)
    notes: str | None = Field(default=None, max_length=2000)


class FlashcardReviewOut(BaseModel):
    card_id: str
    review: dict[str, Any] | None


class ActivityStatus(str, Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"


class ActivityIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ActivityStatus = ActivityStatus.in_progress
    score: int | None = Field(default=None, ge=0, le=100)
    notes: str | None = Field(default=None, max_length=2000)


class ActivityOut(BaseModel):
    item_id: str
    state: dict[str, Any] | None


class NoteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", json_schema_extra={
        "example": {"body": "Remember: authorization must be written and in-scope.", "ref": "chapter:1"}
    })

    body: str = Field(min_length=1, max_length=20_000)
    ref: str | None = Field(default=None, max_length=300)


class NoteOut(ORMModel):
    id: str
    user_id: str
    body: str
    ref: str | None
    created_at: datetime


class BookmarkCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ref: str = Field(min_length=1, max_length=300, examples=["chapter:chapter-01"])
    title: str | None = Field(default=None, max_length=200)


class BookmarkOut(ORMModel):
    id: str
    user_id: str
    ref: str
    title: str | None
    created_at: datetime


# ---------------------------------------------------------------------------
# Content
# ---------------------------------------------------------------------------
class ContentModel(BaseModel):
    model_config = ConfigDict(extra="allow")


class SectionOut(ContentModel):
    id: str
    title: str
    level: int


class ChapterSummary(ContentModel):
    id: int
    slug: str
    title: str
    number: int
    part: str
    description: str
    difficulty: str
    level: int
    minutes: int
    words: int
    schoolIds: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    path: str | None = None


class ChapterDetail(ChapterSummary):
    sections: list[SectionOut] = Field(default_factory=list)
    prerequisites: list[Any] = Field(default_factory=list)


class ToolOut(ContentModel):
    id: str
    name: str
    category: str
    purpose: str
    level: str | None = None
    docs: str | None = None


class CVEOut(ContentModel):
    cve: str
    name: str
    software: str
    category: str
    severity: str
    cvss: str | None = None
    year: int | None = None
    nvd: str | None = None


class QuestionDomain(str, Enum):
    foundational = "Foundational"
    web = "Web"
    network = "Network"
    cloud = "Cloud"
    ai = "AI"
    advanced = "Advanced"


class QuestionOut(ContentModel):
    id: int
    domain: str
    question: str
    answer: str | None = None
    source: str | None = None


class Paged(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int


# ---------------------------------------------------------------------------
# Tutor
# ---------------------------------------------------------------------------
class ChatTurn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=8000)


class TutorMode(str, Enum):
    beginner = "beginner"
    engineer = "engineer"
    researcher = "researcher"


class TutorChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", json_schema_extra={
        "example": {
            "mode": "beginner",
            "message": "Explain same-origin policy using a simple analogy.",
            "chapter_id": 7,
            "selection": "The browser isolates documents from different origins.",
            "history": [],
        }
    })

    mode: TutorMode = Field(default=TutorMode.beginner, description="beginner | engineer | researcher")
    message: str = Field(min_length=1, max_length=8000)
    chapter_id: int | None = Field(default=None, ge=1, le=1000)
    selection: str | None = Field(default=None, max_length=4000)
    history: list[ChatTurn] = Field(default_factory=list, max_length=20)


class TutorChatResponse(BaseModel):
    answer: str
    mode: TutorMode
    offline: bool = Field(description="True when no live model was called.")
    sources: list[str] = Field(default_factory=list)
    conversation_id: str | None = None
    model: str | None = Field(default=None, description="Model name only; never a key or URL.")
    usage: dict[str, int] | None = None
    notice: str | None = Field(default=None, description="Safe, non-sensitive status message.")


# ---------------------------------------------------------------------------
# Health / root
# ---------------------------------------------------------------------------
class DependencyStatus(BaseModel):
    database: bool
    redis: bool


class HealthOut(BaseModel):
    status: Literal["ok", "degraded", "unavailable"]
    version: str
    environment: str
    dependencies: DependencyStatus
