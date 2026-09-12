from __future__ import annotations

import json
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent.serve import Handler

PIXEL = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


class ServeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.thread = threading.Thread(target=self.httpd.serve_forever, daemon=True)
        self.thread.start()
        self.base = f"http://127.0.0.1:{self.httpd.server_address[1]}"

    def tearDown(self) -> None:
        self.httpd.shutdown()
        self.httpd.server_close()

    def test_well_known_falls_back_to_example(self) -> None:
        with urlopen(f"{self.base}/.well-known/openavatar.json") as res:
            payload = json.loads(res.read().decode("utf-8"))
        self.assertEqual(payload["handle"], "example")
        self.assertEqual(payload["license"]["voice"], "no-synthetic")

    def test_api_cards_lists_seed_registry(self) -> None:
        with urlopen(f"{self.base}/api/cards") as res:
            payload = json.loads(res.read().decode("utf-8"))
        handles = {card["handle"] for card in payload["cards"]}
        self.assertIn("example", handles)
        self.assertIn("hermes", handles)

    def test_claim_page(self) -> None:
        with urlopen(self.base + "/") as res:
            html = res.read().decode("utf-8")
        self.assertIn("claim", html.lower())
        self.assertIn("Open Avatar", html)
        self.assertIn("imagine.html", html)

    def test_imagine_page_and_presets(self) -> None:
        with urlopen(self.base + "/imagine.html") as res:
            html = res.read().decode("utf-8")
        self.assertIn("Star Wars", html)
        with urlopen(self.base + "/api/imagine/presets") as res:
            payload = json.loads(res.read().decode("utf-8"))
        ids = {item["id"] for item in payload["presets"]}
        self.assertIn("star-wars", ids)

    def test_imagine_requires_token(self) -> None:
        body = json.dumps(
            {
                "image": "data:image/png;base64," + PIXEL,
                "universe": "star-wars",
                "hobbies": "synths",
            }
        ).encode("utf-8")
        req = Request(
            self.base + "/api/imagine",
            data=body,
            method="POST",
            headers={"Content-Type": "application/json"},
        )
        with self.assertRaises(HTTPError) as ctx:
            urlopen(req)
        self.assertEqual(ctx.exception.code, 401)
        payload = json.loads(ctx.exception.read().decode("utf-8"))
        self.assertEqual(payload["error"], "missing_token")
        self.assertIn("Star Wars", payload["prompt"])


if __name__ == "__main__":
    unittest.main()
