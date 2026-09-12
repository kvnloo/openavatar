"""Universe / hobby restyle prompts + Hugging Face img2img adapter."""

from __future__ import annotations

import base64
import json
import os
import urllib.error
import urllib.request
from typing import Any

DEFAULT_MODEL = "stabilityai/stable-diffusion-xl-base-1.0"
ROUTER = "https://router.huggingface.co/hf-inference/models/{model}"

NEGATIVE = (
    "different person, different face, extra limbs, extra fingers, "
    "low quality, watermark, text, logo, deformed"
)

PRESETS: list[dict[str, str]] = [
    {
        "id": "star-wars",
        "label": "Star Wars",
        "hint": "Cosplay still from that galaxy — same face, film lighting.",
        "style": "Star Wars universe cosplay, cinematic film still, desert planet and rebel aesthetic, costume and lighting of a blockbuster, keep the same face",
    },
    {
        "id": "ghibli",
        "label": "Ghibli",
        "hint": "Soft painted world, still you.",
        "style": "Studio Ghibli-inspired animated portrait, soft painterly light, whimsical landscape, keep the same face",
    },
    {
        "id": "cyberpunk",
        "label": "Cyberpunk",
        "hint": "Night city, neon, rain.",
        "style": "cyberpunk night city portrait, neon rain, holographic signage, same person",
    },
    {
        "id": "noir",
        "label": "Noir",
        "hint": "Black-and-white movie still.",
        "style": "1940s noir film still, high-contrast black and white, cigarette-smoke light, keep the same face",
    },
    {
        "id": "oil",
        "label": "Oil portrait",
        "hint": "Museum wall, your likeness.",
        "style": "classical oil painting portrait, museum lighting, visible brushwork, keep the same face",
    },
    {
        "id": "anime",
        "label": "Anime",
        "hint": "Key visual of you.",
        "style": "anime key visual, sharp cel shading, dramatic sky, keep the same face identity",
    },
]


def preset_style(universe: str) -> str | None:
    for item in PRESETS:
        if item["id"] == universe:
            return item["style"]
    return None


def build_prompt(
    *,
    universe: str = "",
    hobbies: str = "",
    extra: str = "",
    display_name: str = "",
) -> str:
    who = display_name.strip() or "the person in the reference photo"
    parts = [
        f"Portrait of {who}, keep the same person and face identity as the reference photo.",
    ]
    style = preset_style(universe.strip().lower())
    if style:
        parts.append(style)
    extra = extra.strip()
    if extra:
        parts.append(extra)
    hobbies = hobbies.strip()
    if hobbies:
        parts.append(f"Wardrobe, props, and setting styled around their hobbies: {hobbies}.")
    parts.append("Photorealistic unless the style says otherwise. One person. No text.")
    return " ".join(parts)


def decode_image(data_url: str) -> bytes:
    raw = data_url.strip()
    if "," in raw and raw.lower().startswith("data:"):
        raw = raw.split(",", 1)[1]
    try:
        blob = base64.b64decode(raw, validate=True)
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Image must be a data URL or base64.") from exc
    if len(blob) < 32:
        raise ValueError("Image is too small.")
    if len(blob) > 4_000_000:
        raise ValueError("Image must be under 4MB.")
    return blob


def imagine_url(model: str | None = None) -> tuple[str, str]:
    model = model or os.environ.get("OPENAVATAR_IMAGINE_MODEL", DEFAULT_MODEL)
    template = os.environ.get("OPENAVATAR_IMAGINE_URL", ROUTER)
    return template.format(model=model), model


def generate(
    image: bytes,
    prompt: str,
    token: str,
    *,
    timeout: int = 120,
) -> bytes:
    token = token.strip()
    if not token:
        raise PermissionError("Hugging Face token required.")
    url, model = imagine_url()
    payload = {
        "inputs": base64.b64encode(image).decode("ascii"),
        "parameters": {
            "prompt": prompt,
            "negative_prompt": NEGATIVE,
            "guidance_scale": 7.5,
        },
    }
    request = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "image/png",
            "User-Agent": "openavatar/0.1",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read()
            content_type = response.headers.get("Content-Type", "")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Hugging Face {exc.code} ({model}): {detail}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Hugging Face unreachable: {exc.reason}") from exc
    if "application/json" in content_type:
        try:
            message = json.loads(body.decode("utf-8"))
        except json.JSONDecodeError as exc:
            raise RuntimeError("Hugging Face returned JSON we could not parse.") from exc
        raise RuntimeError(str(message.get("error") or message))
    if not body:
        raise RuntimeError("Hugging Face returned an empty image.")
    return body


def to_data_url(image: bytes, content_type: str = "image/png") -> str:
    return f"data:{content_type};base64,{base64.b64encode(image).decode('ascii')}"


def describe() -> dict[str, Any]:
    _, model = imagine_url()
    return {
        "provider": "huggingface",
        "model": model,
        "presets": [{"id": p["id"], "label": p["label"], "hint": p["hint"]} for p in PRESETS],
        "hint": "Paste a free Hugging Face token (Inference Providers permission). Extra latency is expected. Photos stay on this machine until you tap Imagine.",
        "token_url": "https://huggingface.co/settings/tokens",
    }
