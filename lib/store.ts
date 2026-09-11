import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  type CardDraft,
  type IdentityCard,
  normalizeHandle,
  publicCard,
  stampCard,
  validateCardDraft,
} from "./card";
import { hashPassphrase, validatePassphrase, verifyPassphrase } from "./password";

export type StoredAccount = {
  card: IdentityCard;
  passphraseHash?: string;
  salt?: string;
  readonly?: boolean;
};

type StoreFile = {
  accounts: Record<string, StoredAccount>;
};

export class StoreError extends Error {
  status: number;
  field?: string;

  constructor(message: string, status: number, field?: string) {
    super(message);
    this.name = "StoreError";
    this.status = status;
    this.field = field;
  }
}

const seedCards: CardDraft[] = [
  {
    handle: "example",
    kind: "person",
    displayName: "Example Person",
    bio: "A sample Open Identity Card. Claim your own handle — this one is read-only.",
    links: [{ label: "spec", url: "https://github.com/kvnloo/openavatar" }],
    likeness: { tool: "instantid", note: "Run InstantID locally. Do not upload your face here." },
    voice: { tool: "kokoro", note: "Kokoro on loopback. Audio stays on the machine." },
  },
  {
    handle: "hermes",
    kind: "agent",
    displayName: "Hermes",
    bio: "Example agent card. Agents are first-class identities with an optional human controller.",
    controller: "example",
    links: [{ label: "runtime", url: "https://github.com/NousResearch/hermes-agent" }],
    voice: { tool: "zer0-voice" },
  },
];

let writeChain: Promise<void> = Promise.resolve();

export function dataFilePath(): string {
  const dir = process.env.OPENAVATAR_DATA_DIR ?? resolve(process.cwd(), "data");
  return resolve(dir, "openavatar.json");
}

function emptyStore(): StoreFile {
  return { accounts: {} };
}

function readStore(): StoreFile {
  const path = dataFilePath();
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as StoreFile;
    if (!parsed.accounts || typeof parsed.accounts !== "object") return emptyStore();
    return parsed;
  } catch {
    return emptyStore();
  }
}

function writeStore(store: StoreFile): void {
  const path = dataFilePath();
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`);
}

function ensureSeed(store: StoreFile): StoreFile {
  if (Object.keys(store.accounts).length > 0) return store;
  const seeded = emptyStore();
  const now = new Date().toISOString();
  for (const draft of seedCards) {
    const card = stampCard(draft, { createdAt: now, updatedAt: now });
    seeded.accounts[card.handle] = { card, readonly: true };
  }
  writeStore(seeded);
  return seeded;
}

function withStore<T>(fn: (store: StoreFile) => T): Promise<T> {
  const run = writeChain.then(() => {
    const store = ensureSeed(readStore());
    return fn(store);
  });
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function listPublicCards(): Promise<IdentityCard[]> {
  return withStore((store) =>
    Object.values(store.accounts)
      .map((account) => publicCard(account.card))
      .sort((a, b) => a.handle.localeCompare(b.handle)),
  );
}

export function getPublicCard(handle: string): Promise<IdentityCard | null> {
  const key = normalizeHandle(handle);
  return withStore((store) => {
    const account = store.accounts[key];
    return account ? publicCard(account.card) : null;
  });
}

export function getAccount(handle: string): Promise<StoredAccount | null> {
  const key = normalizeHandle(handle);
  return withStore((store) => store.accounts[key] ?? null);
}

export async function claimCard(
  draft: CardDraft,
  passphrase: string,
): Promise<IdentityCard> {
  const issues = validateCardDraft(draft);
  if (issues.length > 0) {
    throw new StoreError(issues[0].message, 400, issues[0].field);
  }
  const passphraseIssue = validatePassphrase(passphrase);
  if (passphraseIssue) throw new StoreError(passphraseIssue, 400, "passphrase");

  return withStore((store) => {
    const handle = normalizeHandle(draft.handle);
    if (store.accounts[handle]) {
      throw new StoreError("That handle is already claimed.", 409, "handle");
    }
    if (draft.kind === "agent" && draft.controller) {
      const controller = normalizeHandle(draft.controller);
      if (controller === handle) {
        throw new StoreError("An agent cannot be its own controller.", 400, "controller");
      }
    }
    const { salt, hash } = hashPassphrase(passphrase);
    const card = stampCard(draft);
    store.accounts[handle] = { card, salt, passphraseHash: hash };
    writeStore(store);
    return publicCard(card);
  });
}

export async function authenticate(
  handle: string,
  passphrase: string,
): Promise<IdentityCard> {
  const account = await getAccount(handle);
  if (!account || account.readonly || !account.salt || !account.passphraseHash) {
    throw new StoreError("Handle or passphrase is wrong.", 401);
  }
  if (!verifyPassphrase(passphrase, account.salt, account.passphraseHash)) {
    throw new StoreError("Handle or passphrase is wrong.", 401);
  }
  return publicCard(account.card);
}

export async function updateCard(
  handle: string,
  patch: Partial<
    Pick<CardDraft, "displayName" | "bio" | "controller" | "links" | "likeness" | "voice">
  >,
): Promise<IdentityCard> {
  return withStore((store) => {
    const key = normalizeHandle(handle);
    const account = store.accounts[key];
    if (!account) throw new StoreError("Card not found.", 404);
    if (account.readonly) throw new StoreError("This sample card cannot be edited.", 403);

    const nextDraft: CardDraft = {
      handle: account.card.handle,
      kind: account.card.kind,
      displayName: patch.displayName ?? account.card.displayName,
      bio: patch.bio ?? account.card.bio,
      controller:
        patch.controller !== undefined ? patch.controller : account.card.controller,
      links: patch.links ?? account.card.links,
      likeness: patch.likeness !== undefined ? patch.likeness : account.card.likeness,
      voice: patch.voice !== undefined ? patch.voice : account.card.voice,
    };
    const issues = validateCardDraft(nextDraft);
    if (issues.length > 0) {
      throw new StoreError(issues[0].message, 400, issues[0].field);
    }
    const card = stampCard(nextDraft, {
      createdAt: account.card.createdAt,
      updatedAt: new Date().toISOString(),
    });
    account.card = card;
    writeStore(store);
    return publicCard(card);
  });
}

export function resetStoreForTests(): void {
  writeStore(emptyStore());
}
