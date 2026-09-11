"""openavatar CLI: init, claim, card sign, card publish."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from cli.openavatar import card, sigil, vault


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def cmd_init(_args: argparse.Namespace) -> int:
    path = vault.init_vault()
    print(f"vault ready: {path}")
    print(f"public key: {vault.public_hex()}")
    return 0


def cmd_claim(args: argparse.Namespace) -> int:
    vault.init_vault()
    minted = card.mint(
        args.handle,
        kind=args.kind,
        display_name=args.name or args.handle,
        bio=args.bio or "",
        controller=args.controller,
    )
    dest = card.current_card_path()
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(json.dumps(minted, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    svg_path = vault.home_dir() / f"{minted['handle']}.svg"
    svg_path.write_text(sigil.sigil_svg(minted["handle"]), encoding="utf-8")
    print(f"claimed @{minted['handle']}")
    print(f"card: {dest}")
    print(f"sigil: {svg_path}")
    return 0


def cmd_card_sign(args: argparse.Namespace) -> int:
    path = Path(args.path) if args.path else card.current_card_path()
    signed = card.sign(_load(path))
    path.write_text(json.dumps(signed, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"signed {path}")
    print(f"publicKey {signed['publicKey']}")
    return 0


def cmd_card_publish(args: argparse.Namespace) -> int:
    path = Path(args.path) if args.path else card.current_card_path()
    payload = _load(path)
    if not card.verify(payload):
        raise SystemExit("Card is unsigned or the signature does not verify. Run `card sign` first.")
    published = card.published_path()
    vault.write_json(published, payload)
    repo_card = Path(args.out) if args.out else Path("cards") / f"{payload['handle']}.json"
    vault.write_json(repo_card, payload)
    print(f"published {published}")
    print(f"registry copy {repo_card}")
    return 0


def cmd_card_show(args: argparse.Namespace) -> int:
    path = Path(args.path) if args.path else card.current_card_path()
    payload = _load(path)
    print(json.dumps(payload, indent=2, sort_keys=True))
    print("signature_ok" if card.verify(payload) else "signature_missing_or_invalid", file=sys.stderr)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="openavatar", description="Open Identity Card vault")
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("init", help="Create an Ed25519 vault").set_defaults(func=cmd_init)

    claim = sub.add_parser("claim", help="Mint a local Open Identity Card")
    claim.add_argument("handle")
    claim.add_argument("--kind", choices=["person", "agent"], default="person")
    claim.add_argument("--name")
    claim.add_argument("--bio", default="")
    claim.add_argument("--controller")
    claim.set_defaults(func=cmd_claim)

    card_p = sub.add_parser("card", help="Sign, publish, or show a card")
    card_sub = card_p.add_subparsers(dest="card_cmd", required=True)
    sign = card_sub.add_parser("sign")
    sign.add_argument("path", nargs="?")
    sign.set_defaults(func=cmd_card_sign)
    publish = card_sub.add_parser("publish")
    publish.add_argument("path", nargs="?")
    publish.add_argument("--out")
    publish.set_defaults(func=cmd_card_publish)
    show = card_sub.add_parser("show")
    show.add_argument("path", nargs="?")
    show.set_defaults(func=cmd_card_show)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
