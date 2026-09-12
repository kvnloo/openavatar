"""Ed25519 vault under ~/.openavatar/vault."""

from __future__ import annotations

import json
import os
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey


def home_dir() -> Path:
    override = os.environ.get("OPENAVATAR_HOME")
    if override:
        return Path(override)
    return Path.home() / ".openavatar"


def vault_dir() -> Path:
    return home_dir() / "vault"


def key_path() -> Path:
    return vault_dir() / "ed25519.pem"


def init_vault() -> Path:
    vault_dir().mkdir(parents=True, exist_ok=True)
    path = key_path()
    if path.exists():
        return path
    key = Ed25519PrivateKey.generate()
    path.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    path.chmod(0o600)
    return path


def load_private() -> Ed25519PrivateKey:
    path = key_path()
    if not path.exists():
        raise FileNotFoundError("Vault is empty. Run `openavatar init` first.")
    return serialization.load_pem_private_key(path.read_bytes(), password=None)


def public_hex(key: Ed25519PrivateKey | None = None) -> str:
    private = key or load_private()
    return private.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    ).hex()


def sign_bytes(payload: bytes) -> str:
    return load_private().sign(payload).hex()


def verify_bytes(public_key_hex: str, payload: bytes, signature_hex: str) -> bool:
    public = Ed25519PublicKey.from_public_bytes(bytes.fromhex(public_key_hex))
    try:
        public.verify(bytes.fromhex(signature_hex), payload)
        return True
    except Exception:
        return False


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n", encoding="utf-8")
