# Open Avatar

Claimable public identity + local likeness/voice studio.
Open Identity Card for people and agents.

This is a **thin assembly**, not a new model stack, and it is **not Dash**.
The product is a public handle, a one-of-one person mark, and a card agents
can read. Then you can Imagine yourself in other universes — Star Wars
cosplay, a movie that’s dropping, the look of your hobbies.

## Claim loop (P0)

```bash
python -m pip install -r requirements.txt
python -m unittest discover -s tests -t . -v

python -m cli.openavatar init
python -m cli.openavatar claim ada --name "Ada Lovelace"
python -m cli.openavatar card sign
python -m cli.openavatar card publish

python agent/serve.py --port 3000
```

Laptop: http://127.0.0.1:3000

Vault keys live in `~/.openavatar/vault` (override with `OPENAVATAR_HOME`).

## Phone

Same Wi-Fi as the laptop:

```bash
python agent/serve.py --host 0.0.0.0 --port 3000
```

On the phone open `http://<laptop-lan-ip>:3000` (Claim) and
`/imagine.html` (camera / camera roll). iOS will offer a share sheet for
the card JSON. Signing the card is still the vault CLI on a computer.

We do not scrape Instagram or TikTok. Link those profiles on the card;
drop photos you already exported.

## Imagine (universes / hobbies)

`/imagine.html` restyles **you** from a photo. Hugging Face is the first
remote adapter — extra latency, free-tier token.

1. Get a token with Inference Providers: https://huggingface.co/settings/tokens
2. Paste it on Imagine (stored only in this browser) or export `HF_TOKEN`
3. Pick Star Wars / Ghibli / a custom movie line + hobbies
4. Wait. Face lock is “best effort” on SDXL img2img; local InstantID/PulID is P2

```bash
export HF_TOKEN=hf_...
python agent/serve.py --host 0.0.0.0 --port 3000
```

Override model with `OPENAVATAR_IMAGINE_MODEL` (default
`stabilityai/stable-diffusion-xl-base-1.0` via
`https://router.huggingface.co/hf-inference/models/...`).

Other free-ish adapters later: Hugging Face Spaces (visitor quota),
Groq (text/style only), Cloudflare Workers AI, transformers.js on-device
for tiny models. None of those replace the identity card.

## Card

`schema/openavatar.schema.json` is the Open Identity Card.

Default consent until you timestamp otherwise:

* `license.voice = no-synthetic`
* `license.commercial = negotiate`
* `license.likeness = attribution-required`

The sigil is a passport-adjacent **person mark** (`openavatar-person-mark/v1`),
not a Hermes model-passport plate.

## Later

* P1 local spoken + written studio
* P2 local visual trainer (HeyGen is a helper, not core)
* P3 likeness monetize / x402
* Social OAuth import
* `https://<handle>.openavatar.org/.well-known/openavatar.json`

## Linear

Canonical spec: [PER-1425](https://linear.app/0ism/issue/PER-1425).
P0: [PER-1426](https://linear.app/0ism/issue/PER-1426).
Imagine: [PER-1458](https://linear.app/0ism/issue/PER-1458).
