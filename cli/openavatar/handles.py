"""Handle rules for Open Identity Cards."""

from __future__ import annotations

import re

HANDLE_PATTERN = re.compile(r"^[a-z][a-z0-9-]{1,30}[a-z0-9]$")

RESERVED = {
    "about",
    "admin",
    "agent",
    "api",
    "card",
    "cards",
    "claim",
    "explore",
    "openavatar",
    "root",
    "studio",
    "www",
}


def normalize(raw: str) -> str:
    return raw.strip().lower()


def validate(raw: str) -> str:
    handle = normalize(raw)
    if not HANDLE_PATTERN.fullmatch(handle):
        raise ValueError(
            "Handle must be 3–32 chars, start with a letter, and use lowercase letters, digits, and hyphens."
        )
    if handle in RESERVED:
        raise ValueError(f"Handle '{handle}' is reserved.")
    return handle
