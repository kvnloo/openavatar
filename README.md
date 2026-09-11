# Open Avatar

Claimable public identity + local likeness/voice studio.
Open Identity Card for people and agents.

This repo is a **thin assembly**, not a new model stack. The product is a public
handle and a card. Likeness and voice stay on the owner's machine and are pointed
at existing tools.

## How close is launch?

v0 is the launch bar:

1. Claim a handle (person or agent) with a passphrase — no waitlist, no vendor.
2. Public card at `/c/{handle}` and JSON at `/api/cards/{handle}`.
3. Directory of claimed cards.
4. Studio catalog (Kokoro, Faster Whisper, InstantID, LivePortrait, zer0-voice)
   as pointers, not hosted biometric media.

Remaining to go fully live for strangers on the public internet:

* Host it (Vercel, Fly, or any Node host with a persistent disk).
* Set `OPENAVATAR_SESSION_SECRET`.
* Put `data/` on a persistent volume (the JSON file is the registry; serverless
  filesystems are ephemeral).
* Point a domain. Optional later: Clerk as an assembled login, Postgres as an
  assembled store.

## Run

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Claim a handle, edit the
card, attach a studio tool.

Sample cards `@example` and `@hermes` are seeded read-only so the directory is
not empty on first boot.

## Identity object

An Open Identity Card is a small JSON document:

```json
{
  "handle": "ada",
  "kind": "person",
  "displayName": "Ada Lovelace",
  "bio": "…",
  "links": [{ "label": "github", "url": "https://github.com/ada" }],
  "likeness": { "tool": "instantid" },
  "voice": { "tool": "kokoro" }
}
```

Agents use `"kind": "agent"` and may name a human `controller` handle.

Machine discovery: `GET /.well-known/openavatar.json`.

## What this is not

* Not CardTwin (Pokémon cards).
* Not a cloud TTS/ASR/renderer.
* Not a waitlist.
