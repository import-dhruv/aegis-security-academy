"""Grounded AI tutor endpoint with a fully functional offline fallback."""

from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_optional_current_user
from app.config import get_settings
from app.db import get_session
from app.models import TutorConversation, TutorMessage, User
from app.routers.content import load_json
from app.schemas import TutorChatRequest, TutorChatResponse, TutorMode
from app.security import sanitize_text, scrub_secrets

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(prefix="/tutor", tags=["tutor"])

SYSTEM_PROMPT = """You are the AEGIS Tutor, the teaching assistant of the AEGIS Cybersecurity & Bug Bounty Academy. You are a tutor, not an operator: you explain concepts, never perform actions.

GROUNDING RULES
1. Ground claims in the ACADEMY CONTEXT provided with each question and in widely accepted standards (OWASP, NIST CSF, MITRE ATT&CK/CWE, CISA, RFCs). If the context is thin, say so and stay at the level of well-established fundamentals.
2. Cite sources inline, e.g. [AEGIS Ch. 7 — title], [Tool: name], [CVE-2021-44228], [OWASP], [NIST CSF], [MITRE CWE-79]. Never invent a citation, URL, CVE identifier, chapter number, or quote.
3. Never claim you scanned, exploited, or verified anything. Do not fabricate tool output.

EXPLANATION MODES — follow the requested mode exactly
- beginner: plain language, one concrete analogy, define jargon on first use, short paragraphs, a tiny local-lab example only. No code unless asked.
- engineer: implementation-oriented — data flow, trust boundaries, concrete request/response shape, detection and mitigation, minimal safe lab pseudocode.
- researcher: precise and technical — root cause, threat model, assumptions, relevant standards/CVEs, limitations, and pointers to primary sources; distinguish established facts from hypotheses.

SAFETY BOUNDARIES — ABSOLUTE
- Educational knowledge is NOT permission to test any system. Repeat this principle whenever a question edges toward practice.
- Refuse step-by-step instructions for unauthorized exploitation, credential theft, malware, persistence, lateral movement, data exfiltration, denial of service, or bypassing access controls on systems the user does not own or have explicit written permission to test.
- Never help target a specific real third party (domain, IP, account, or person), and never help hide activity or evade detection on such systems.
- You MAY explain a vulnerability class conceptually: what it is, why it happens, how defenders detect it, and how to fix it. Any worked payload must be harmless and restricted to an owned lab such as DVWA, OWASP Juice Shop, or a local VM.
- If a request is disallowed, refuse briefly with the reason and immediately offer a safe alternative: a lab exercise, a detection rule, a mitigation, or a authorized-learning path.
- Reinforce scope, written authorization, privacy/data minimization, and responsible disclosure where relevant.

STYLE
- Answer in Markdown with short sections and bullets. Lead with the direct answer. Be concise; prefer clarity over completeness. End with 1-3 concrete "next steps" that stay inside the safe hierarchy: owned systems → local labs → CTFs → written authorization → bug-bounty scope."""


def _chapter_context(chapter_id: int | None) -> tuple[str, list[str]]:
    """Return a compact, grounded context block and its source labels."""
    if chapter_id is None:
        return "No specific chapter was selected. Use general AEGIS fundamentals.", []

    for chapter in load_json("chapters.json"):
        if chapter.get("id") == chapter_id or chapter.get("number") == chapter_id:
            title = str(chapter.get("title", "Untitled chapter"))
            number = chapter.get("number", chapter.get("id", "?"))
            description = sanitize_text(str(chapter.get("description", "")), max_length=900)
            tags = ", ".join(str(tag) for tag in chapter.get("tags", [])[:12])
            sections = [
                str(section.get("title"))
                for section in chapter.get("sections", [])[:12]
                if isinstance(section, dict)
            ]
            block = (
                f"[AEGIS Ch. {number} — {title}]\n"
                f"Description: {description}\n"
                f"Topics: {tags or 'n/a'}\n"
                f"Sections: {'; '.join(sections) or 'n/a'}"
            )
            return block, [f"AEGIS Ch. {number} — {title}"]
    return "The requested chapter id was not found in the academy content.", []


def _build_messages(payload: TutorChatRequest, message: str, context: str) -> list[dict[str, str]]:
    """Construct a bounded chat payload: last turns first, oldest dropped first."""
    turns: list[dict[str, str]] = [
        {"role": turn.role.value if hasattr(turn.role, "value") else turn.role,
         "content": sanitize_text(turn.content, max_length=2000)}
        for turn in payload.history[-12:]
    ]

    user_text = (
        f"MODE: {payload.mode.value}\n\n"
        f"QUESTION:\n{message}\n\n"
        f"SELECTED TEXT (ignore if empty):\n{sanitize_text(payload.selection, max_length=2000)}\n\n"
        f"ACADEMY CONTEXT:\n{context}\n\n"
        "Follow the grounding, mode and safety rules. Cite only real sources from the context."
    )
    turns.append({"role": "user", "content": user_text})

    # Enforce a character budget by trimming the oldest history turns.
    budget = settings.tutor_max_input_chars
    while len(turns) > 1 and sum(len(t["content"]) for t in turns) > budget:
        turns.pop(0)
    return [{"role": "system", "content": SYSTEM_PROMPT}, *turns]


def _endpoint_and_headers() -> tuple[str, str, dict[str, str]] | None:
    """Resolve an OpenAI-compatible endpoint, model and headers — never returned to clients."""
    key = settings.openai_api_key
    if not key:
        return None
    base = settings.ai_gateway_url
    if base:
        url = base.rstrip("/")
        if not url.endswith("/chat/completions"):
            url = f"{url}/chat/completions"
    else:
        url = "https://api.openai.com/v1/chat/completions"
    return url, settings.tutor_model, {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }


def _offline_scaffold(mode: TutorMode, message: str, sources: list[str]) -> str:
    """A clearly flagged, first-principles scaffold when no model is configured."""
    emphasis = {
        TutorMode.beginner: (
            "Start from an everyday analogy, then name the technical term. Keep sentences short."
        ),
        TutorMode.engineer: (
            "Trace the data flow across trust boundaries; name the exact control that fails and the fix."
        ),
        TutorMode.researcher: (
            "State the threat model, the root cause, the established standard that covers it, and the limits of what is known."
        ),
    }[mode]

    source_line = ", ".join(sources + ["AEGIS Academy ethics framework"]) or "AEGIS Academy fundamentals"
    question = message[:300] + ("…" if len(message) > 300 else "")
    return (
        "> **Offline teaching mode.** No language model was called. Use this first-principles "
        "scaffold to work the idea out yourself, then re-ask when a model is configured.\n\n"
        f"**Your question:** {question}\n\n"
        f"**Mode guidance ({mode.value}):** {emphasis}\n\n"
        "### 1. Define it in one sentence\n"
        "What is the thing being asked about, in your own words, with no jargon?\n\n"
        "### 2. Build the mental model\n"
        "What are the parts, who are the actors, and where are the trust boundaries? "
        "Draw them on paper before reaching for a tool.\n\n"
        "### 3. Explain the mechanism\n"
        "Walk through cause → effect step by step. Why does the behaviour happen at all "
        "rather than being a list of memorised facts?\n\n"
        "### 4. Ground it\n"
        "Map each claim to a source. If you cannot cite it, mark it as a hypothesis and verify it. "
        f"Available sources for this question: {source_line}.\n\n"
        "### 5. Practise safely\n"
        "Choose the next rung of the safe hierarchy: owned system → local lab → CTF → "
        "explicit written authorization → published bug-bounty scope. Never test a real "
        "system without written permission.\n\n"
        "### 6. Defend and disclose\n"
        "Name one detection signal and one mitigation. If you find something real, contain "
        "evidence, notify the owner privately, allow remediation time, and coordinate disclosure."
    )


@router.post(
    "/chat",
    response_model=TutorChatResponse,
    summary="Ask the grounded tutor (works offline)",
)
async def chat(
    payload: TutorChatRequest,
    current_user: User | None = Depends(get_optional_current_user),
    session: AsyncSession = Depends(get_session),
) -> TutorChatResponse:
    message = sanitize_text(payload.message, max_length=settings.tutor_max_input_chars)
    context, sources = _chapter_context(payload.chapter_id)
    messages = _build_messages(payload, message, context)

    connection = _endpoint_and_headers()
    conversation_id: str | None = None
    answer: str
    model_name: str | None = None
    usage: dict[str, int] | None = None
    offline = connection is None
    notice: str | None = None

    if connection is not None:
        url, model_name, headers = connection
        body: dict[str, Any] = {
            "model": model_name,
            "messages": messages,
            "max_tokens": settings.tutor_max_output_tokens,
            "temperature": 0.3,
        }
        try:
            async with httpx.AsyncClient(timeout=settings.tutor_timeout_seconds) as client:
                response = await client.post(url, headers=headers, json=body)
                response.raise_for_status()
                data = response.json()
            answer = str(data["choices"][0]["message"]["content"]).strip()
            raw_usage = data.get("usage") or {}
            usage = {
                key: int(raw_usage[key])
                for key in ("prompt_tokens", "completion_tokens", "total_tokens")
                if key in raw_usage
            }
            if not answer:
                raise ValueError("Model returned an empty answer")
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError) as exc:
            # Log only the exception type and a scrubbed message — never URL or headers.
            logger.warning("Tutor model call failed (%s): %s", type(exc).__name__, scrub_secrets(exc))
            offline = True
            model_name = None
            answer = _offline_scaffold(payload.mode, message, sources)
            notice = "The model was unavailable; an offline scaffold is shown instead."
    else:
        answer = _offline_scaffold(payload.mode, message, sources)
        notice = "No model is configured. Set AI_GATEWAY_URL and OPENAI_API_KEY to enable live answers."

    if current_user is not None:
        conversation = TutorConversation(
            user_id=current_user.id,
            title=(message[:80] or "Tutor conversation"),
            mode=payload.mode.value,
        )
        session.add(conversation)
        await session.flush()
        session.add_all([
            TutorMessage(
                conversation_id=conversation.id,
                role="user",
                content=message,
                sources=[],
            ),
            TutorMessage(
                conversation_id=conversation.id,
                role="assistant",
                content=answer,
                sources=sources,
            ),
        ])
        await session.commit()
        conversation_id = conversation.id

    return TutorChatResponse(
        answer=answer,
        mode=payload.mode,
        offline=offline,
        sources=sources + ["AEGIS Academy ethics framework"],
        conversation_id=conversation_id,
        model=model_name,
        usage=usage,
        notice=notice,
    )


@router.get("/modes", summary="Describe the three explanation modes")
async def modes() -> dict[str, Any]:
    return {
        "modes": [
            {"id": "beginner", "description": "Plain language, analogies, no jargon dump."},
            {"id": "engineer", "description": "Implementation detail, detection and mitigation."},
            {"id": "researcher", "description": "Threat model, root cause, standards and citations."},
        ],
        "configured": settings.tutor_configured,
        "note": "When no model is configured the tutor returns a clearly flagged offline scaffold.",
    }
