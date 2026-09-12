from __future__ import annotations

import base64
import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from agent import imagine

PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)


class PromptTests(unittest.TestCase):
    def test_star_wars_keeps_identity(self) -> None:
        prompt = imagine.build_prompt(
            universe="star-wars",
            hobbies="synths, motorcycles",
            extra="the new film",
            display_name="Kevin",
        )
        self.assertIn("same person", prompt.lower())
        self.assertIn("Star Wars", prompt)
        self.assertIn("synths", prompt)
        self.assertIn("the new film", prompt)
        self.assertIn("Kevin", prompt)

    def test_decode_image(self) -> None:
        data = "data:image/png;base64," + base64.b64encode(PNG).decode("ascii")
        self.assertEqual(imagine.decode_image(data), PNG)

    def test_generate_requires_token(self) -> None:
        with self.assertRaises(PermissionError):
            imagine.generate(PNG, "prompt", "")

    def test_generate_posts_to_hf(self) -> None:
        class Resp:
            headers = {"Content-Type": "image/png"}

            def read(self) -> bytes:
                return PNG

            def __enter__(self):
                return self

            def __exit__(self, *args) -> None:
                return None

        with patch("agent.imagine.urllib.request.urlopen", return_value=Resp()) as mocked:
            out = imagine.generate(PNG, "Star Wars cosplay", "hf_test")
        self.assertEqual(out, PNG)
        request = mocked.call_args[0][0]
        self.assertIn("huggingface.co", request.full_url)
        self.assertEqual(request.get_header("Authorization"), "Bearer hf_test")
        payload = json.loads(request.data.decode("utf-8"))
        self.assertIn("prompt", payload["parameters"])


if __name__ == "__main__":
    unittest.main()
