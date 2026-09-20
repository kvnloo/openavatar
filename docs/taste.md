# Taste Library v0

OpenAvatar Taste is a portable library of references a person deliberately keeps because they like an interaction, visual language, ad, landing page, launch video, product, or other creative idea.

The v0 interchange format is intentionally small. It stores **references and annotations**, not copies of third-party assets.

## Files

- `schema/taste-v0.schema.json` — JSON Schema for the v0.1 interchange format.
- `examples/taste.example.json` — mixed UI/ad/landing/video fixture.

## Privacy

`private` is the default visibility. Producers SHOULD write the visibility field explicitly. Consumers MUST treat a missing or unknown visibility as private.

A future public Taste Card is a derived projection. It must not expose private URLs or notes merely because a taste library exists.

## Forward compatibility

The schema permits unknown fields so producers can add non-breaking metadata.

Consumers should:

1. Require a recognized `schema_version`.
2. Ignore unknown fields they do not understand.
3. Preserve unknown fields when round-tripping data where practical.
4. Treat changes to required semantics as a new explicit schema version.

## Stable identity

Collections and references carry stable string ids. Import adapters should use deterministic source identity where possible so repeated imports are idempotent.

## Rights and provenance

A Taste Library records what a user saved or referenced. It does not grant permission to redistribute, train on, or commercially reuse the underlying third-party asset. `provenance` records where the reference came from so downstream tools can preserve that distinction.

Closes the schema slice of #2 and is tracked directly by #3.
