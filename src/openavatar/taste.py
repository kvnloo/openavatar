from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse, urlunparse

SCHEMA_VERSION = "0.1"
MEDIA_TYPES = {
    "ui",
    "interaction",
    "ad",
    "landing_page",
    "launch_video",
    "image",
    "video",
    "website",
    "product",
    "other",
}
VISIBILITIES = {"private", "public"}


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def default_taste_path() -> Path:
    configured = os.environ.get("OPENAVATAR_TASTE_FILE")
    if configured:
        return Path(configured).expanduser()
    return Path("~/.openavatar/taste.json").expanduser()


def new_library(profile_id: str | None = None) -> dict[str, Any]:
    library: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "collections": [],
        "references": [],
    }
    if profile_id:
        library["profile_id"] = profile_id
    return library


def canonicalize_url(value: str) -> str:
    raw = value.strip()
    parsed = urlparse(raw)
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.netloc:
        raise ValueError("reference URL must be an absolute http(s) URL")
    normalized = parsed._replace(
        scheme=parsed.scheme.lower(),
        netloc=parsed.netloc.lower(),
        fragment="",
    )
    return urlunparse(normalized)


def slugify_collection(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
    if not slug:
        raise ValueError("collection name must contain letters or numbers")
    return slug[:128]


def reference_id(canonical_url: str) -> str:
    digest = hashlib.sha256(canonical_url.encode("utf-8")).hexdigest()[:16]
    return f"ref-{digest}"


def validate_library(library: dict[str, Any]) -> None:
    if library.get("schema_version") != SCHEMA_VERSION:
        raise ValueError(
            f"unsupported taste schema_version {library.get('schema_version')!r}; expected {SCHEMA_VERSION!r}"
        )
    if not isinstance(library.get("collections"), list):
        raise ValueError("taste collections must be an array")
    if not isinstance(library.get("references"), list):
        raise ValueError("taste references must be an array")


def load_library(path: Path) -> dict[str, Any]:
    if not path.exists():
        return new_library()
    with path.open("r", encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ValueError("taste file must contain a JSON object")
    validate_library(value)
    return value


def save_library(path: Path, library: dict[str, Any]) -> None:
    validate_library(library)
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(library, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(payload, encoding="utf-8")
    os.replace(temp, path)


def ensure_collection(
    library: dict[str, Any],
    name: str,
    *,
    visibility: str = "private",
    now: str | None = None,
) -> dict[str, Any]:
    if visibility not in VISIBILITIES:
        raise ValueError(f"unsupported visibility: {visibility}")
    collection_id = slugify_collection(name)
    for collection in library["collections"]:
        if collection.get("id") == collection_id:
            return collection
    collection = {
        "id": collection_id,
        "name": name.strip(),
        "visibility": visibility,
        "created_at": now or utc_now(),
    }
    library["collections"].append(collection)
    return collection


def add_reference(
    library: dict[str, Any],
    url: str,
    *,
    collection_name: str,
    media_type: str = "other",
    title: str | None = None,
    note: str | None = None,
    tags: list[str] | None = None,
    visibility: str = "private",
    source: str = "manual",
    now: str | None = None,
) -> tuple[dict[str, Any], bool]:
    if media_type not in MEDIA_TYPES:
        raise ValueError(f"unsupported media type: {media_type}")
    if visibility not in VISIBILITIES:
        raise ValueError(f"unsupported visibility: {visibility}")
    canonical_url = canonicalize_url(url)
    timestamp = now or utc_now()
    collection = ensure_collection(library, collection_name, now=timestamp)

    for existing in library["references"]:
        if existing.get("canonical_url") != canonical_url:
            continue
        memberships = existing.setdefault("collections", [])
        if collection["id"] not in memberships:
            memberships.append(collection["id"])
            memberships.sort()
        return existing, False

    clean_tags = sorted({tag.strip() for tag in (tags or []) if tag.strip()})
    item: dict[str, Any] = {
        "id": reference_id(canonical_url),
        "canonical_url": canonical_url,
        "media_type": media_type,
        "collections": [collection["id"]],
        "visibility": visibility,
        "provenance": {"source": source.strip() or "manual"},
        "added_at": timestamp,
    }
    if title:
        item["title"] = title.strip()
    if note:
        item["note"] = note.strip()
    if clean_tags:
        item["tags"] = clean_tags
    library["references"].append(item)
    library["references"].sort(key=lambda ref: (ref.get("added_at", ""), ref.get("id", "")))
    return item, True


def list_references(
    library: dict[str, Any],
    *,
    collection_name: str | None = None,
    visibility: str | None = None,
) -> list[dict[str, Any]]:
    collection_id = slugify_collection(collection_name) if collection_name else None
    if visibility is not None and visibility not in VISIBILITIES:
        raise ValueError(f"unsupported visibility: {visibility}")
    result = []
    for item in library["references"]:
        if collection_id and collection_id not in item.get("collections", []):
            continue
        if visibility and item.get("visibility", "private") != visibility:
            continue
        result.append(item)
    return sorted(result, key=lambda ref: (ref.get("added_at", ""), ref.get("id", "")))


def canonical_json(value: Any, *, pretty: bool = True) -> str:
    if pretty:
        return json.dumps(value, indent=2, sort_keys=True, ensure_ascii=False)
    return json.dumps(value, separators=(",", ":"), sort_keys=True, ensure_ascii=False)
