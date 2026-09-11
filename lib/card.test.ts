import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RESERVED_HANDLES,
  stampCard,
  validateCardDraft,
  validateHandle,
} from "./card";

describe("handles", () => {
  it("accepts a short lowercase handle", () => {
    assert.equal(validateHandle("ada"), null);
  });

  it("rejects reserved words", () => {
    assert.equal(validateHandle("studio")?.field, "handle");
    assert.ok(RESERVED_HANDLES.has("api"));
  });

  it("normalizes uppercase to a lowercase handle", () => {
    assert.equal(validateHandle("Ada"), null);
    assert.ok(validateHandle("ada_lovelace"));
    assert.ok(validateHandle("a"));
  });
});

describe("card drafts", () => {
  it("requires a display name", () => {
    const issues = validateCardDraft({
      handle: "ada",
      kind: "person",
      displayName: "  ",
    });
    assert.ok(issues.some((issue) => issue.field === "displayName"));
  });

  it("forbids a controller on a person card", () => {
    const issues = validateCardDraft({
      handle: "ada",
      kind: "person",
      displayName: "Ada",
      controller: "example",
    });
    assert.ok(issues.some((issue) => issue.field === "controller"));
  });

  it("stamps an agent card with a controller", () => {
    const card = stampCard({
      handle: "Hermes",
      kind: "agent",
      displayName: "Hermes",
      controller: "Example",
    });
    assert.equal(card.handle, "hermes");
    assert.equal(card.controller, "example");
    assert.equal(card.kind, "agent");
  });
});
