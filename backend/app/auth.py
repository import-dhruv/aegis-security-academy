"""Password hashing, JWT issuance/validation and request-scoped authorization.

Security notes:
- No function in this module logs a password, token, or key.
- TODO items mark hardening that must be added before internet exposure.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.db import get_session
from app.models import User, UserRole

logger = logging.getLogger(__name__)
settings = get_settings()

bearer_scheme = HTTPBearer(auto_error=False, description="Bearer access token")

credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

# ---------------------------------------------------------------------------
# Password hashing
# ---------------------------------------------------------------------------
try:  # Preferred: bcrypt via passlib.
    from passlib.context import CryptContext

    _crypt = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)
    _HASHER = "bcrypt"
except Exception:  # pragma: no cover - exercised only in minimal environments
    _crypt = None
    _HASHER = "pbkdf2_sha256"
    logger.warning(
        "passlib/bcrypt is unavailable; falling back to PBKDF2-SHA256. "
        "Install passlib[bcrypt] before deploying."
    )

_PBKDF2_ROUNDS = 240_000


def hash_password(password: str) -> str:
    """Hash a plaintext password; the plaintext is never logged or stored."""
    if _crypt is not None:
        return _crypt.hash(password)
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Constant-time verification against bcrypt or the PBKDF2 fallback."""
    try:
        if hashed.startswith("pbkdf2_sha256$"):
            _, rounds, salt_hex, digest_hex = hashed.split("$", 3)
            candidate = hashlib.pbkdf2_hmac(
                "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(rounds)
            )
            return hmac.compare_digest(candidate.hex(), digest_hex)
        if _crypt is not None:
            return bool(_crypt.verify(password, hashed))
    except (ValueError, TypeError):
        return False
    return False


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _create_token(
    user_id: str,
    token_type: str,
    lifetime: timedelta,
    *,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    now = _now()
    payload: dict[str, Any] = {
        "sub": user_id,
        "type": token_type,
        "iat": now,
        "exp": now + lifetime,
        "jti": secrets.token_urlsafe(16),
        "iss": "aegis-academy",
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def create_access_token(user_id: str) -> str:
    return _create_token(
        user_id, "access", timedelta(minutes=settings.access_token_expire_minutes)
    )


def create_refresh_token(user_id: str) -> str:
    return _create_token(
        user_id, "refresh", timedelta(days=settings.refresh_token_expire_days)
    )


def decode_token(token: str, expected_type: str) -> dict[str, Any]:
    """Decode and verify a JWT, enforcing its intended purpose (access/refresh)."""
    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm],
            issuer="aegis-academy",
            options={"require": ["exp", "sub", "type"]},
        )
    except jwt.PyJWTError as exc:
        # Log the exception class only, never the token string.
        logger.debug("Token validation failed: %s", type(exc).__name__)
        raise credentials_exception from None

    if payload.get("type") != expected_type or not payload.get("sub"):
        raise credentials_exception
    return payload


def hash_token(raw_token: str) -> str:
    """Hash a refresh token for at-rest storage (never store the raw token)."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Require a valid bearer access token and return the matching user."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise credentials_exception
    payload = decode_token(credentials.credentials, "access")
    user = await session.get(User, str(payload["sub"]))
    if user is None:
        raise credentials_exception
    # TODO: check a server-side session/denylist here if instant revocation is needed.
    return user


async def get_optional_current_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> User | None:
    """Resolve a user when credentials are present; otherwise return None.

    Used by the tutor so anonymous visitors can still use the offline scaffold.
    """
    header = request.headers.get("authorization", "")
    parts = header.split(None, 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    try:
        payload = decode_token(parts[1], "access")
    except HTTPException:
        return None
    return await session.get(User, str(payload["sub"]))


def require_roles(*allowed: UserRole):
    """Dependency factory: restrict a route to the given roles."""

    async def _role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient privileges for this operation",
            )
        return user

    return _role_checker


# TODO(production hardening before public deployment):
# 1. Add per-IP and per-account rate limiting on /login, /register and /refresh
#    (use app.security.check_rate_limit with Redis in production).
# 2. Add account lockout / exponential backoff after repeated failed logins.
# 3. Add email verification and a password-reset flow with single-use tokens.
# 4. Rotate SECRET_KEY with a JWKS/KID scheme and short-lived access tokens.
# 5. Enforce MFA for instructor/admin accounts and audit privileged actions.
