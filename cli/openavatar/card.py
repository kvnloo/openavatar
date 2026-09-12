"""Open Identity Card create / sign / verify."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any

from cli.openavatar import handles, sigil, vault

SPEC = "open-identity-card/v0"

DEFAULT_LICENSE = {
    "voice": "no-synthetic",
    "commercial": "negotiate",
    "likeness": "attribution-required",
}


def now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def canonical_bytes(card: dict[str, Any]) -> bytes:
    unsigned = {key: value for key, value in card.items() if key != "signature"}
    return json.dumps(unsigned, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode(
        "utf-8"
    )


def mint(
    handle: str,
    *,
    kind: str = "person",
    display_name: str,
    bio: str = "",
    controller: str | None = None,
    links: list[dict[str, str]] | None = None,
) -> dict[str, Any]:
    handle = handles.validate(handle)
    if kind not in {"person", "agent"}:
        raise ValueError("kind must be person or agent")
    if kind == "agent" and controller:
        controller = handles.validate(controller)
        if controller == handle:
            raise ValueError("An agent cannot be its own controller.")
    elif kind != "agent":
        controller = None
    stamped = now()
    card: dict[str, Any] = {
        "spec": SPEC,
        "handle": handle,
        "kind": kind,
        "displayName": display_name.strip(),
        "bio": bio.strip(),
        "links": links or [],
        "license": dict(DEFAULT_LICENSE),
        "consent": {"voiceAt": None, "likenessAt": None, "commercialAt": None},
        "avatar": {
            "sigil_algorithm": sigil.ALGORITHM,
            "sigil_hash": sigil.sigil_hash(handle),
        },
        "createdAt": stamped,
        "updatedAt": stamped,
    }
    if controller:
        card["controller"] = controller
    return card


def sign(card: dict[str, Any]) -> dict[str, Any]:
    signed = dict(card)
    signed["publicKey"] = vault.public_hex()
    signed["updatedAt"] = now()
    signed["signature"] = vault.sign_bytes(canonical_bytes(signed))
    return signed


def verify(card: dict[str, Any]) -> bool:
    public_key = card.get("publicKey")
    signature = card.get("signature")
    if not public_key or not signature:
        return False
    return vault.verify_bytes(public_key, canonical_bytes(card), signature)


def current_card_path():
    return vault.home_dir() / "card.json"


def published_path():
    return vault.home_dir() / "published" / "openavatar.json"
