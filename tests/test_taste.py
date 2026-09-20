import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

from openavatar.cli import main
from openavatar.taste import add_reference, load_library, new_library


class TasteLibraryTests(unittest.TestCase):
    def test_add_defaults_to_private_and_is_idempotent(self):
        library = new_library()
        item, created = add_reference(
            library,
            "https://Example.com/design#section",
            collection_name="UI Ideas",
            media_type="ui",
            tags=["dense", "dense", " navigation "],
            now="2026-09-20T00:00:00Z",
        )
        self.assertTrue(created)
        self.assertEqual(item["canonical_url"], "https://example.com/design")
        self.assertEqual(item["visibility"], "private")
        self.assertEqual(item["tags"], ["dense", "navigation"])
        self.assertEqual(library["collections"][0]["visibility"], "private")

        again, created_again = add_reference(
            library,
            "https://example.com/design",
            collection_name="UI Ideas",
            media_type="ui",
            now="2026-09-20T00:00:01Z",
        )
        self.assertFalse(created_again)
        self.assertEqual(again["id"], item["id"])
        self.assertEqual(len(library["references"]), 1)

    def test_cli_add_list_export_round_trips(self):
        with tempfile.TemporaryDirectory() as tempdir:
            path = Path(tempdir) / "taste.json"

            with redirect_stdout(io.StringIO()):
                self.assertEqual(
                    main(
                        [
                            "--file",
                            str(path),
                            "taste",
                            "add",
                            "https://example.com/ad",
                            "--collection",
                            "Ads",
                            "--type",
                            "ad",
                            "--tag",
                            "product-led",
                        ]
                    ),
                    0,
                )

            stored = load_library(path)
            self.assertEqual(len(stored["references"]), 1)

            list_out = io.StringIO()
            with redirect_stdout(list_out):
                self.assertEqual(
                    main(["--file", str(path), "taste", "list", "--collection", "Ads"]),
                    0,
                )
            listed = json.loads(list_out.getvalue())
            self.assertEqual([item["canonical_url"] for item in listed], ["https://example.com/ad"])

            export_out = io.StringIO()
            with redirect_stdout(export_out):
                self.assertEqual(main(["--file", str(path), "taste", "export"]), 0)
            self.assertEqual(json.loads(export_out.getvalue()), stored)


if __name__ == "__main__":
    unittest.main()
