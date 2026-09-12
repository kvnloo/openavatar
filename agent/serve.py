#!/usr/bin/env python3
"""Serve the static claim site, published card, and registry."""

from __future__ import annotations

import argparse
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agent import imagine
WEB = ROOT / "web" / "claim"
CARDS = ROOT / "cards"
MAX_POST = 5_500_000


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path == "/.well-known/openavatar.json":
            self._send_json(self._well_known())
            return
        if path.startswith("/cards/"):
            name = Path(path).name
            path_on_disk = CARDS / name
            if path_on_disk.is_file():
                self._send_bytes(path_on_disk.read_bytes(), "application/json")
                return
            self.send_error(404)
            return
        if path == "/api/cards":
            cards = []
            if CARDS.is_dir():
                for card_path in sorted(CARDS.glob("*.json")):
                    cards.append(json.loads(card_path.read_text(encoding="utf-8")))
            self._send_json({"cards": cards})
            return
        if path == "/api/imagine/presets":
            self._send_json(imagine.describe())
            return
        super().do_GET()

    def do_POST(self) -> None:  # noqa: N802
        path = self.path.split("?", 1)[0]
        if path != "/api/imagine":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0 or length > MAX_POST:
            self.send_error(413, "payload too large")
            return
        try:
            body = json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json({"error": "invalid_json"}, status=400)
            return
        try:
            prompt = imagine.build_prompt(
                universe=str(body.get("universe") or ""),
                hobbies=str(body.get("hobbies") or ""),
                extra=str(body.get("extra") or ""),
                display_name=str(body.get("displayName") or ""),
            )
            image = imagine.decode_image(str(body.get("image") or ""))
        except ValueError as exc:
            self._send_json({"error": "bad_request", "detail": str(exc), "prompt": ""}, status=400)
            return
        token = (
            str(body.get("token") or "")
            or (self.headers.get("Authorization") or "").removeprefix("Bearer ").strip()
            or os.environ.get("HF_TOKEN", "")
        )
        if not token:
            self._send_json(
                {
                    "error": "missing_token",
                    "prompt": prompt,
                    "hint": "Add a Hugging Face token with Inference Providers permission, or set HF_TOKEN.",
                    "token_url": "https://huggingface.co/settings/tokens",
                    **imagine.describe(),
                },
                status=401,
            )
            return
        try:
            png = imagine.generate(image, prompt, token)
        except PermissionError as exc:
            self._send_json({"error": "missing_token", "detail": str(exc), "prompt": prompt}, status=401)
            return
        except RuntimeError as exc:
            self._send_json({"error": "provider", "detail": str(exc), "prompt": prompt}, status=502)
            return
        self._send_json(
            {
                "ok": True,
                "prompt": prompt,
                "image": imagine.to_data_url(png),
                "provider": "huggingface",
                "model": imagine.imagine_url()[1],
            }
        )

    def _well_known(self) -> dict:
        env_home = Path(os.environ.get("OPENAVATAR_HOME", str(Path.home() / ".openavatar")))
        published = env_home / "published" / "openavatar.json"
        if published.is_file():
            return json.loads(published.read_text(encoding="utf-8"))
        example = CARDS / "example.json"
        if example.is_file():
            return json.loads(example.read_text(encoding="utf-8"))
        return {
            "spec": "open-identity-card/v0",
            "service": "openavatar",
            "hint": "Run `python -m cli.openavatar claim <handle> && python -m cli.openavatar card sign && python -m cli.openavatar card publish`",
        }

    def _send_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, indent=2, sort_keys=True).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def _send_bytes(self, body: bytes, content_type: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


def main() -> None:
    parser = argparse.ArgumentParser(description="OpenAvatar local identity server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3000)
    args = parser.parse_args()
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"OpenAvatar claim site http://{args.host}:{args.port}")
    print("  GET  /.well-known/openavatar.json")
    print("  GET  /api/cards")
    print("  GET  /imagine.html")
    print("  POST /api/imagine")
    if args.host in {"0.0.0.0", "::"}:
        print("Phone on the same Wi-Fi: http://<this-machine-lan-ip>:%s" % args.port)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
