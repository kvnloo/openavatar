from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .taste import (
    MEDIA_TYPES,
    VISIBILITIES,
    add_reference,
    canonical_json,
    default_taste_path,
    list_references,
    load_library,
    save_library,
)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="openavatar")
    parser.add_argument(
        "--file",
        type=Path,
        default=default_taste_path(),
        help="Taste manifest path (default: ~/.openavatar/taste.json or OPENAVATAR_TASTE_FILE).",
    )

    commands = parser.add_subparsers(dest="command", required=True)
    taste = commands.add_parser("taste", help="Manage the local Taste Library.")
    taste_commands = taste.add_subparsers(dest="taste_command", required=True)

    add = taste_commands.add_parser("add", help="Save a reference.")
    add.add_argument("url")
    add.add_argument("--collection", required=True)
    add.add_argument("--type", dest="media_type", choices=sorted(MEDIA_TYPES), default="other")
    add.add_argument("--title")
    add.add_argument("--note")
    add.add_argument("--tag", action="append", default=[])
    add.add_argument("--visibility", choices=sorted(VISIBILITIES), default="private")
    add.add_argument("--source", default="manual")

    list_cmd = taste_commands.add_parser("list", help="List saved references.")
    list_cmd.add_argument("--collection")
    list_cmd.add_argument("--visibility", choices=sorted(VISIBILITIES))

    export = taste_commands.add_parser("export", help="Print the portable Taste Library JSON.")
    export.add_argument("--compact", action="store_true")

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    path = args.file.expanduser()

    try:
        library = load_library(path)

        if args.command != "taste":
            parser.error("unsupported command")

        if args.taste_command == "add":
            item, created = add_reference(
                library,
                args.url,
                collection_name=args.collection,
                media_type=args.media_type,
                title=args.title,
                note=args.note,
                tags=args.tag,
                visibility=args.visibility,
                source=args.source,
            )
            save_library(path, library)
            print(canonical_json({"created": created, "reference": item}))
            return 0

        if args.taste_command == "list":
            print(
                canonical_json(
                    list_references(
                        library,
                        collection_name=args.collection,
                        visibility=args.visibility,
                    )
                )
            )
            return 0

        if args.taste_command == "export":
            print(canonical_json(library, pretty=not args.compact))
            return 0

        parser.error("unsupported taste command")
        return 2
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"openavatar: {error}", file=sys.stderr)
        return 1
