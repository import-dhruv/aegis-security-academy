"""Small, dependency-light security helpers shared across the API.

These are pragmatic scaffolding helpers, not a replacement for a gateway,
WAF, or a mature rate-limiting service.
"""

from __future__ import annotations

import html
import ipaddress
import logging
import re
import time
import unicodedata
from typing import Any
from urllib.parse import urlsplit, urlunsplit

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

# Redaction patterns are applied to any text before it reaches a log sink.
_SECRET_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"(?i)(bearer\s+)[A-Za-z0-9._\-]+"), r"\1[REDACTED]"),
    (re.compile(r"\bsk-[A-Za-z0-9\-_]{12,}"), "[REDACTED]"),
    (re.compile(r"\bAKIA[0-9A-Z]{16}\b"), "[REDACTED]"),
    (
        re.compile(r"\beyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}"),
        "[REDACTED_JWT]",
    ),
    (
        re.compile(
            r"(?i)((?:password|passwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token)\s*[=:]\s*)"
            r"['\"]?[^\s'\",&]+"
        ),
        r"\1[REDACTED]",
    ),
)


# ---------------------------------------------------------------------------
# Log hygiene
# ---------------------------------------------------------------------------
def scrub_secrets(text: str | Any) -> str:
    """Remove credential-shaped substrings from text before logging it."""
    value = str(text)
    for pattern, replacement in _SECRET_PATTERNS:
        value = pattern.sub(replacement, value)
    return value


# ---------------------------------------------------------------------------
# Input hygiene
# ---------------------------------------------------------------------------
def sanitize_text(value: str | None, *, max_length: int = 8000) -> str:
    """Normalise user text: drop control characters, collapse whitespace, cap length."""
    if not value:
        return ""
    text = unicodedata.normalize("NFC", value)
    text = _CONTROL_CHARS.sub("", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    return text.strip()[:max_length]


def escape_html(value: str) -> str:
    """Escape text that a client might render as HTML."""
    return html.escape(value, quote=True)


def validate_research_url(url: str) -> str:
    """Validate an external research link.

    Only absolute http/https URLs with a public-looking host are accepted;
    javascript:, data:, file:, credential-bearing URLs and loopback/private
    addresses are rejected. Raises ValueError on failure.
    """
    parsed = urlsplit((url or "").strip())
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Only absolute http(s) URLs are allowed")
    if parsed.username or parsed.password:
        raise ValueError("Credential-bearing URLs are not allowed")
    host = parsed.hostname
    if not host:
        raise ValueError("A hostname is required")
    host = host.lower().rstrip(".")
    if host in {"localhost", "::1"} or host.endswith(".localhost"):
        raise ValueError("Localhost URLs are not allowed")
    try:
        address = ipaddress.ip_address(host)
    except ValueError:
        if "." not in host and ":" not in host:
            raise ValueError("A fully qualified hostname is required") from None
    else:
        if (
            address.is_private
            or address.is_loopback
            or address.is_link_local
            or address.is_multicast
            or address.is_reserved
        ):
            raise ValueError("Private or reserved addresses are not allowed")
    return urlunsplit((parsed.scheme.lower(), parsed.netloc, parsed.path, parsed.query, ""))


# ---------------------------------------------------------------------------
# Rate limiting (Redis when configured, in-memory fallback otherwise)
# ---------------------------------------------------------------------------
class _MemoryRateLimiter:
    """Coarse fixed-window limiter suitable for single-process development."""

    def __init__(self) -> None:
        self._hits: dict[str, tuple[float, int]] = {}

    async def allow(self, key: str, limit: int, window: int) -> tuple[bool, int]:
        now = time.monotonic()
        start, count = self._hits.get(key, (now, 0))
        if now - start >= window:
            start, count = now, 0
        count += 1
        self._hits[key] = (start, count)
        if len(self._hits) > 10_000:  # crude memory bound
            self._hits = {
                k: v for k, v in self._hits.items() if now - v[0] < window
            }
        return (count <= limit, max(0, int(window - (now - start))))


_memory_limiter = _MemoryRateLimiter()
_redis_client: Any | None = None
_warned_in_memory = False


def _get_redis() -> Any | None:
    global _redis_client
    if _redis_client is None and settings.redis_url:
        try:
            import redis.asyncio as aioredis

            _redis_client = aioredis.from_url(settings.redis_url, decode_responses=True)
        except Exception as exc:  # pragma: no cover
            logger.warning("Redis client init failed (%s); using in-memory limiter", type(exc).__name__)
    return _redis_client


async def check_rate_limit(
    key: str,
    *,
    limit: int | None = None,
    window_seconds: int = 60,
    namespace: str = "rl",
) -> tuple[bool, int]:
    """Return ``(allowed, retry_after_seconds)`` for a rate-limit key."""
    limit = limit or settings.rate_limit_per_minute
    bucket = f"{namespace}:{scrub_secrets(key)}"

    client = _get_redis()
    if client is not None:
        try:
            pipe = client.pipeline()
            pipe.incr(bucket)
            pipe.expire(bucket, window_seconds, nx=True)
            count, _ = await pipe.execute()
            ttl = await client.ttl(bucket)
            return (int(count) <= limit, max(0, int(ttl)))
        except Exception as exc:
            logger.warning("Redis rate limiting unavailable (%s); falling back to memory", type(exc).__name__)

    global _warned_in_memory
    if not _warned_in_memory:
        logger.warning(
            "WARNING: using in-memory rate limiting. It is process-local and NOT suitable "
            "for production or multi-worker deployments — configure REDIS_URL."
        )
        _warned_in_memory = True
    return await _memory_limiter.allow(bucket, limit, window_seconds)


async def check_redis() -> bool:
    """Best-effort Redis liveness probe for /healthz."""
    client = _get_redis()
    if client is None:
        return False
    try:
        return bool(await client.ping())
    except Exception:
        return False
