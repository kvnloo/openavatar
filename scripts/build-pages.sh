#!/usr/bin/env bash
# Build the static GitHub Pages tree from web/claim + seed cards.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:-"$ROOT/_site"}"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -a "$ROOT/web/claim/." "$DEST/"
python3 - <<PY
import json
from pathlib import Path
root = Path("$ROOT")
dest = Path("$DEST")
cards = [json.loads(p.read_text()) for p in sorted((root / "cards").glob("*.json"))]
(dest / "registry.json").write_text(json.dumps({"cards": cards}, indent=2) + "\n")
(dest / ".nojekyll").write_text("")
PY
echo "built $DEST"
