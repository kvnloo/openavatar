import { sigilHash, sigilSvg } from "./sigil.js";

const HANDLE = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;
const RESERVED = new Set([
  "about",
  "admin",
  "agent",
  "api",
  "card",
  "cards",
  "claim",
  "explore",
  "openavatar",
  "root",
  "studio",
  "www",
]);

function parseLinks(raw) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const space = line.indexOf(" ");
      if (space === -1) return { label: line, url: line };
      return { label: line.slice(0, space), url: line.slice(space + 1).trim() };
    });
}

async function mintCard(form) {
  const handle = form.handle.value.trim().toLowerCase();
  if (!HANDLE.test(handle)) {
    throw new Error("Handle must be 3–32 lowercase letters, digits, and hyphens.");
  }
  if (RESERVED.has(handle)) {
    throw new Error(`Handle '${handle}' is reserved.`);
  }
  const kind = form.kind.value;
  const card = {
    spec: "open-identity-card/v0",
    handle,
    kind,
    displayName: form.displayName.value.trim(),
    bio: form.bio.value.trim(),
    links: parseLinks(form.links.value),
    license: {
      voice: "no-synthetic",
      commercial: "negotiate",
      likeness: "attribution-required",
    },
    consent: { voiceAt: null, likenessAt: null, commercialAt: null },
    avatar: {
      sigil_algorithm: "openavatar-person-mark/v1",
      sigil_hash: await sigilHash(handle),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (kind === "agent" && form.controller.value.trim()) {
    card.controller = form.controller.value.trim().toLowerCase();
  }
  return card;
}

const form = document.querySelector("#claim");
const sigilEl = document.querySelector("#sigil");
const jsonEl = document.querySelector("#json");
const status = document.querySelector("#status");

async function preview() {
  const handle = form.handle.value.trim().toLowerCase() || "example";
  sigilEl.innerHTML = await sigilSvg(handle);
}

form.handle.addEventListener("input", () => {
  preview().catch(() => {});
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.hidden = true;
  try {
    const card = await mintCard(form);
    jsonEl.textContent = JSON.stringify(card, null, 2);
    localStorage.setItem("openavatar.card", JSON.stringify(card));
    const blob = new Blob([JSON.stringify(card, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${card.handle}.openavatar.json`;
    a.click();
    status.hidden = false;
    status.classList.remove("err");
    status.textContent = `Claimed @${card.handle}. Sign it with python -m cli.openavatar card sign.`;
    await preview();
  } catch (error) {
    status.hidden = false;
    status.classList.add("err");
    status.textContent = error.message;
  }
});

preview();
