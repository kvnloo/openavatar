from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from cli.openavatar import card, vault
from cli.openavatar.__main__ import main


class CliFlowTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        os.environ["OPENAVATAR_HOME"] = str(Path(self.tmp.name) / "home")
        self.cwd = Path(self.tmp.name) / "repo"
        self.cwd.mkdir()
        self._old = os.getcwd()
        os.chdir(self.cwd)

    def tearDown(self) -> None:
        os.chdir(self._old)
        self.tmp.cleanup()

    def test_init_claim_sign_publish(self) -> None:
        self.assertEqual(main(["init"]), 0)
        self.assertEqual(
            main(["claim", "ada", "--name", "Ada Lovelace", "--bio", "Notes on the engine."]),
            0,
        )
        self.assertEqual(main(["card", "sign"]), 0)
        self.assertEqual(main(["card", "publish"]), 0)
        published = json.loads((Path(os.environ["OPENAVATAR_HOME"]) / "published" / "openavatar.json").read_text())
        self.assertEqual(published["handle"], "ada")
        self.assertEqual(published["license"]["voice"], "no-synthetic")
        self.assertEqual(published["license"]["commercial"], "negotiate")
        self.assertEqual(published["license"]["likeness"], "attribution-required")
        self.assertTrue(card.verify(published))
        copy = json.loads((self.cwd / "cards" / "ada.json").read_text())
        self.assertEqual(copy["publicKey"], vault.public_hex())
        self.assertEqual(published["avatar"]["sigil_algorithm"], "openavatar-person-mark/v1")
        tampered = dict(published)
        tampered["bio"] = "tampered"
        self.assertFalse(card.verify(tampered))

    def test_agent_controller(self) -> None:
        main(["init"])
        self.assertEqual(
            main(["claim", "kerdoios", "--kind", "agent", "--name", "Kerdoios", "--controller", "ada"]),
            0,
        )
        payload = json.loads((Path(os.environ["OPENAVATAR_HOME"]) / "card.json").read_text())
        self.assertEqual(payload["kind"], "agent")
        self.assertEqual(payload["controller"], "ada")

    def test_unsigned_publish_fails(self) -> None:
        main(["init"])
        main(["claim", "ada", "--name", "Ada"])
        with self.assertRaises(SystemExit):
            main(["card", "publish"])


if __name__ == "__main__":
    unittest.main()
