import { after, afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  authenticate,
  claimCard,
  listPublicCards,
  resetStoreForTests,
  StoreError,
} from "./store";

const dir = mkdtempSync(join(tmpdir(), "openavatar-"));
process.env.OPENAVATAR_DATA_DIR = dir;
process.env.OPENAVATAR_SCRYPT_N = "1024";

afterEach(() => {
  resetStoreForTests();
});

after(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("claim", () => {
  it("lets a person claim a unique handle", async () => {
    const card = await claimCard(
      { handle: "ada", kind: "person", displayName: "Ada Lovelace" },
      "analytical-engine",
    );
    assert.equal(card.handle, "ada");
    const listed = await listPublicCards();
    assert.ok(listed.some((item) => item.handle === "ada"));
    assert.ok(listed.some((item) => item.handle === "example"));
  });

  it("rejects a duplicate claim", async () => {
    await claimCard(
      { handle: "ada", kind: "person", displayName: "Ada" },
      "analytical-engine",
    );
    await assert.rejects(
      () =>
        claimCard(
          { handle: "ada", kind: "person", displayName: "Other Ada" },
          "analytical-engine",
        ),
      (error: unknown) => error instanceof StoreError && error.status === 409,
    );
  });

  it("does not put the passphrase on the public card", async () => {
    const card = await claimCard(
      { handle: "kvn", kind: "person", displayName: "Kevin" },
      "not-a-real-secret",
    );
    assert.equal("passphrase" in card, false);
    assert.equal("passphraseHash" in card, false);
  });

  it("authenticates with the same passphrase", async () => {
    await claimCard(
      { handle: "ada", kind: "person", displayName: "Ada" },
      "analytical-engine",
    );
    const card = await authenticate("ada", "analytical-engine");
    assert.equal(card.displayName, "Ada");
    await assert.rejects(
      () => authenticate("ada", "wrong-passphrase"),
      (error: unknown) => error instanceof StoreError && error.status === 401,
    );
  });
});
