# Open Avatar

Claimable public identity + local likeness/voice studio.
Open Identity Card for people and agents.

This is a **thin assembly**, not a new model stack, and it is **not Dash**.
The product is a public handle, a one-of-one person mark, and a card agents
can read. Spoken voice, written style, visual avatars, and likeness licensing
come after this P0.

## Claim loop (P0)

OpenShaders-style: claim a name, get a unique artifact.

```bash
python -m pip install -r requirements.txt
python -m unittest discover -s tests -t . -v

python -m cli.openavatar init
python -m cli.openavatar claim ada --name "Ada Lovelace"
python -m cli.openavatar card sign
python -m cli.openavatar card publish

python agent/serve.py --port 3000
```

Then open http://127.0.0.1:3000 — claim in the browser (instant person mark)
or inspect `/.well-known/openavatar.json` after the CLI publish.

Vault keys live in `~/.openavatar/vault` (override with `OPENAVATAR_HOME`).

## Card

`schema/openavatar.schema.json` is the Open Identity Card.

Default consent until you timestamp otherwise:

* `license.voice = no-synthetic`
* `license.commercial = negotiate`
* `license.likeness = attribution-required`

The sigil is a passport-adjacent **person mark** (`openavatar-person-mark/v1`),
not a Hermes model-passport plate.

## Later (not this tree)

* P1 local spoken + written studio
* P2 visual avatar (HeyGen is a helper, not core)
* P3 likeness monetize / x402
* `https://<handle>.openavatar.org/.well-known/openavatar.json`

## Linear

Canonical spec: [PER-1425](https://linear.app/0ism/issue/PER-1425).
P0 leaf: [PER-1426](https://linear.app/0ism/issue/PER-1426).
