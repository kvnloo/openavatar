"""Passport-adjacent deterministic person mark. Same algorithm as web/claim/sigil.js."""

from __future__ import annotations

import hashlib

ALGORITHM = "openavatar-person-mark/v1"
SEED = "openavatar-sigil:v1:"


def sigil_hash(handle: str) -> str:
    return hashlib.sha256(f"{SEED}{handle}".encode("utf-8")).hexdigest()


def _byte(digest: bytes, index: int) -> int:
    return digest[index % len(digest)]


def sigil_svg(handle: str) -> str:
    digest = bytes.fromhex(sigil_hash(handle))
    ink = "#1c1812"
    paper = "#efe4d0" if _byte(digest, 0) % 2 == 0 else "#d7e4ea"
    brass = "#c4a574"
    head_r = 28 + (_byte(digest, 3) % 10)
    head_y = 118 + (_byte(digest, 4) % 12)
    shoulder = 58 + (_byte(digest, 5) % 18)
    marks = []
    for i in range(3):
        x = 40 + _byte(digest, 8 + i * 3) % 160
        y = 40 + _byte(digest, 9 + i * 3) % 70
        kind = _byte(digest, 10 + i * 3) % 3
        if kind == 0:
            marks.append(
                f'<circle cx="{x}" cy="{y}" r="5" fill="none" stroke="{brass}" stroke-width="1.4"/>'
            )
        elif kind == 1:
            marks.append(
                f'<rect x="{x - 5}" y="{y - 5}" width="10" height="10" fill="none" stroke="{brass}" stroke-width="1.4"/>'
            )
        else:
            marks.append(
                f'<path d="M{x},{y - 6} L{x + 6},{y + 5} L{x - 6},{y + 5} Z" fill="none" stroke="{brass}" stroke-width="1.4"/>'
            )
    mark_svg = "\n    ".join(marks)
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 320" role="img" aria-label="Open Avatar sigil for {handle}">
  <rect width="240" height="320" rx="14" fill="{paper}"/>
  <rect x="12" y="12" width="216" height="296" rx="8" fill="none" stroke="{ink}" stroke-width="1.2"/>
  <text x="20" y="36" font-family="ui-monospace, monospace" font-size="9" letter-spacing="2.4" fill="{ink}">OPEN IDENTITY CARD</text>
  <text x="220" y="36" text-anchor="end" font-family="ui-monospace, monospace" font-size="9" letter-spacing="1.6" fill="{ink}">PERSON</text>
  <circle cx="120" cy="{head_y}" r="{head_r}" fill="none" stroke="{ink}" stroke-width="2.2"/>
  <path d="M{120 - shoulder},{head_y + head_r + 18} C{120 - shoulder + 8},{head_y + head_r + 4} {120 + shoulder - 8},{head_y + head_r + 4} {120 + shoulder},{head_y + head_r + 18} L{120 + shoulder + 8},268 L{120 - shoulder - 8},268 Z" fill="none" stroke="{ink}" stroke-width="2.2"/>
    {mark_svg}
  <text x="20" y="292" font-family="ui-monospace, monospace" font-size="14">@{handle}</text>
  <text x="20" y="306" font-family="ui-monospace, monospace" font-size="8" fill="{ink}">{ALGORITHM}</text>
</svg>
"""
