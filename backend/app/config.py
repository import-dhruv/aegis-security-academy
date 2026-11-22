"""Central, environment-driven configuration for the AEGIS API.

All values can be supplied as environment variables or in a ``.env`` file.
Secrets are read here only; no module should hard-code credentials.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Self

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_PRODUCTION_NAMES = {"production", "prod", "live"}


class Settings(BaseSettings):
    """Application settings loaded from the environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Runtime -----------------------------------------------------------
    environment: str = Field(default="development", description="development | staging | production")
    host: str = "0.0.0.0"
    port: int = Field(default=8000, ge=1, le=65535)
    api_prefix: str = "/api/v1"

    # --- Persistence -------------------------------------------------------
    database_url: str | None = Field(
        default=None,
        description="Async SQLAlchemy URL. Falls back to local SQLite when unset.",
    )
    redis_url: str | None = Field(default=None, description="Optional Redis URL for rate limiting.")

    # --- Security ----------------------------------------------------------
    secret_key: str = Field(
        default="dev-only-secret-change-me-before-deploying-000000",
        description="HS256 signing key. MUST be overridden outside development.",
    )
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=30, ge=1, le=1440)
    refresh_token_expire_days: int = Field(default=7, ge=1, le=365)
    cors_origins: str | list[str] = Field(
        default="http://localhost:3000",
        description="Comma-separated browser origins allowed to call the API.",
    )

    # --- AI tutor (all optional; the API works fully offline without them) --
    ai_gateway_url: str | None = Field(
        default=None,
        description="OpenAI-compatible base URL (e.g. an AI Gateway endpoint).",
    )
    openai_api_key: str | None = Field(default=None, description="Model provider API key, if any.")
    tutor_model: str = Field(default="gpt-4o-mini", description="Model identifier used for tutor calls.")
    tutor_timeout_seconds: float = Field(default=20.0, gt=0, le=120)
    tutor_max_input_chars: int = Field(default=8000, ge=500, le=50000)
    tutor_max_output_tokens: int = Field(default=700, ge=100, le=4000)

    # --- Content -----------------------------------------------------------
    content_data_dir: str | None = Field(
        default=None,
        description="Override directory containing the static JSON content files.",
    )
    rate_limit_per_minute: int = Field(default=60, ge=1, le=100000)

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("environment", mode="before")
    @classmethod
    def _normalise_environment(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("algorithm", mode="before")
    @classmethod
    def _normalise_algorithm(cls, value: str) -> str:
        # JWT algorithm identifiers are case-sensitive (e.g. HS256).
        return value.strip()

    @field_validator("ai_gateway_url", "redis_url")
    @classmethod
    def _blank_to_none(cls, value: str | None) -> str | None:
        return value.strip() or None if isinstance(value, str) else value

    @model_validator(mode="after")
    def _validate_production_secrets(self) -> Self:
        if self.is_production:
            if len(self.secret_key) < 32:
                raise ValueError(
                    "SECRET_KEY must be at least 32 characters in production. "
                    "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(48))'"
                )
            if "*" in self.cors_origins:
                raise ValueError("Wildcard CORS origins are not allowed in production.")
        return self

    @property
    def is_production(self) -> bool:
        return self.environment in _PRODUCTION_NAMES

    @property
    def cors_origin_list(self) -> list[str]:
        return self.cors_origins if isinstance(self.cors_origins, list) else [self.cors_origins]

    @property
    def tutor_configured(self) -> bool:
        """True only when a usable model endpoint and credential are present."""
        return bool((self.ai_gateway_url or self.openai_api_key) and self.openai_api_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached settings singleton (env is read once at first use)."""
    return Settings()
