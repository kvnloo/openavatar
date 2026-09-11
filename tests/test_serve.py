from __future__ import annotations

import json
import sys
import threading
import unittest
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.request import urlopen

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent.serve import Handler


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


if __name__ == "__main__":
    unittest.main()
