from __future__ import annotations

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cli.openavatar.handles import validate
from cli.openavatar.sigil import ALGORITHM, sigil_hash, sigil_svg


class HandleTests(unittest.TestCase):
    def test_accepts(self) -> None:
        self.assertEqual(validate("Ada"), "ada")

    def test_reserved(self) -> None:
        with self.assertRaises(ValueError):
            validate("claim")


class SigilTests(unittest.TestCase):
    def test_stable_hash(self) -> None:
        self.assertEqual(len(sigil_hash("example")), 64)
        self.assertEqual(sigil_hash("example"), sigil_hash("example"))
        self.assertNotEqual(sigil_hash("example"), sigil_hash("hermes"))
        self.assertEqual(
            sigil_hash("example"),
            "7ed9aef54e1fc63d90c6c28c6044ecc90ddbbde5a8ba69a3e076ed230527d98f",
        )

    def test_svg_contains_handle_and_algorithm(self) -> None:
        svg = sigil_svg("example")
        self.assertIn("@example", svg)
        self.assertIn(ALGORITHM, svg)
        self.assertTrue(svg.startswith("<svg"))


if __name__ == "__main__":
    unittest.main()
