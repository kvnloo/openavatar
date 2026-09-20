# openavatar

Claimable public identity + local likeness/voice/taste studio. Open Identity Card for people and agents.

## Taste Library

OpenAvatar can carry a portable, user-owned library of creative references: UI interactions, ads, landing pages, launch videos, and other things a person deliberately saves because they like them.

The first interchange format lives at `schema/taste-v0.schema.json`; see `docs/taste.md`.


### Local CLI

The first local workflow is dependency-light and private by default:

```bash
python -m pip install -e .
openavatar taste add https://example.com/ad --collection "Ads I like" --type ad
openavatar taste list --collection "Ads I like"
openavatar taste export
```

The default manifest is `~/.openavatar/taste.json`. Set `OPENAVATAR_TASTE_FILE` or pass `--file` to use another path.
