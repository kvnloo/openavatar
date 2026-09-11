#!/usr/bin/env python3
"""Serve the static claim site, published card, and registry."""

from __future__ import annotations

import argparse
import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web" / "claim"
CARDS = ROOT / "cards"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.split("?", 1)[0] == "/.well-known/openavatar.json":
            self._send_json(self._well_known())
            return
        if self.path.startswith("/cards/"):
            name = Path(self.path.split("?", 1)[0]).name
            path = CARDS / name
            if path.is_file():
                self._send_bytes(path.read_bytes(), "application/json")
                return
            self.send_error(404)
            return
        if self.path.split("?", 1)[0] == "/api/cards":
            cards = []
            if CARDS.is_dir():
                for path in sorted(CARDS.glob("*.json")):
                    cards.append(json.loads(path.read_text(encoding="utf-8")))
            self._send_json({"cards": cards})
            return
        super().do_GET()

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

    def _send_json(self, payload: dict) -> None:
        body = json.dumps(payload, indent=2, sort_keys=True).encode("utf-8")
        self._send_bytes(body, "application/json")

    def _send_bytes(self, body: bytes, content_type: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args) -> None:  # noqa: A003
        sys_stderr = __import__("sys").stderr
        sys_stderr.write("%s - %s\n" % (self.address_string(), format % args))


def main() -> None:
    parser = argparse.ArgumentParser(description="OpenAvatar local identity server")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=3000)
    args = parser.parse_args()
    httpd = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"OpenAvatar claim site http://{args.host}:{args.port}")
    print("  GET /.well-known/openavatar.json")
    print("  GET /api/cards")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
