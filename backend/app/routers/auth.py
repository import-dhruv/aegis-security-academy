"""Authentication endpoints: registration, login, refresh and profile."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    hash_token,
    verify_password,
)
from app.config import get_settings
from app.db import get_session
from app.models import RefreshToken, User, UserRole
from app.schemas import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserOut,
)

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/auth", tags=["auth"])


async def _issue_tokens(
    session: AsyncSession,
    user_id: str,
    user_agent: str | None,
) -> TokenPair:
    """Create an access/refresh pair and persist only a hash of the refresh token."""
    access = create_access_token(user_id)
    refresh = create_refresh_token(user_id)
    session.add(
        RefreshToken(
            user_id=user_id,
            token_hash=hash_token(refresh),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.refresh_token_expire_days),
            user_agent=(user_agent or "")[:300] or None,
        )
    )
    return TokenPair(
        access_token=access,
        refresh_token=refresh,
        token_type="bearer",
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a student account",
)
async def register(
    payload: RegisterRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> AuthResponse:
    email = payload.email.strip().lower()
    existing = await session.scalar(select(User).where(func.lower(User.email) == email))
    if existing:
        raise HTTPException(status_code=409, detail="An account with that email already exists")

    user = User(
        email=email,
        display_name=payload.display_name.strip(),
        hashed_password=hash_password(payload.password),
        role=UserRole.student,  # Self-registration can never grant privileged roles.
    )
    session.add(user)
    try:
        await session.flush()
        tokens = await _issue_tokens(session, user.id, request.headers.get("user-agent"))
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="An account with that email already exists") from None

    # TODO: send a verification email here; mark accounts unverified until confirmed.
    return AuthResponse(**tokens.model_dump(), user=UserOut.model_validate(user))


@router.post("/login", response_model=AuthResponse, summary="Exchange credentials for tokens")
async def login(
    payload: LoginRequest,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> AuthResponse:
    # TODO: apply rate limiting and account lockout here (see app.auth TODOs).
    email = payload.email.strip().lower()
    user = await session.scalar(select(User).where(func.lower(User.email) == email))
    # Use the same generic error for unknown users and wrong passwords.
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tokens = await _issue_tokens(session, user.id, request.headers.get("user-agent"))
    await session.commit()
    return AuthResponse(**tokens.model_dump(), user=UserOut.model_validate(user))


@router.post("/refresh", response_model=TokenPair, summary="Rotate a refresh token")
async def refresh(
    payload: RefreshRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenPair:
    claims = decode_token(payload.refresh_token.strip(), "refresh")
    token_hash = hash_token(payload.refresh_token.strip())

    stored = await session.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == str(claims["sub"]),
        )
    )
    expires_at = stored.expires_at if stored else None
    if expires_at is not None and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if (
        stored is None
        or stored.revoked
        or (expires_at is not None and expires_at <= datetime.now(timezone.utc))
    ):
        raise HTTPException(status_code=401, detail="Refresh token is invalid or expired")

    user = await session.get(User, stored.user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Refresh token is invalid or expired")

    # Rotate: revoke the presented token, then issue a fresh pair.
    stored.revoked = True
    tokens = await _issue_tokens(session, user.id, None)
    await session.commit()
    return tokens


@router.get("/me", response_model=UserOut, summary="Get the current user")
async def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut.model_validate(current_user)
