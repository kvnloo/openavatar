export const HANDLE_PATTERN = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

export const RESERVED_HANDLES = new Set([
  "about",
  "admin",
  "api",
  "c",
  "card",
  "cards",
  "claim",
  "directory",
  "health",
  "help",
  "login",
  "logout",
  "me",
  "openavatar",
  "privacy",
  "root",
  "signup",
  "signin",
  "status",
  "studio",
  "support",
  "system",
  "terms",
  "www",
]);

export type EntityKind = "person" | "agent";

export type StudioPointer = {
  tool: string;
  note?: string;
  url?: string;
};

export type IdentityLink = {
  label: string;
  url: string;
};

export type IdentityCard = {
  handle: string;
  kind: EntityKind;
  displayName: string;
  bio: string;
  controller?: string;
  links: IdentityLink[];
  likeness?: StudioPointer;
  voice?: StudioPointer;
  createdAt: string;
  updatedAt: string;
};

export type CardDraft = {
  handle: string;
  kind: EntityKind;
  displayName: string;
  bio?: string;
  controller?: string;
  links?: IdentityLink[];
  likeness?: StudioPointer;
  voice?: StudioPointer;
};

export type CardIssue = { field: string; message: string };

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateHandle(raw: string): CardIssue | null {
  const handle = normalizeHandle(raw);
  if (!HANDLE_PATTERN.test(handle)) {
    return {
      field: "handle",
      message:
        "Handle must be 3–32 characters, start with a letter, and use only lowercase letters, digits, and hyphens.",
    };
  }
  if (RESERVED_HANDLES.has(handle)) {
    return { field: "handle", message: "That handle is reserved." };
  }
  return null;
}

export function publicCard(card: IdentityCard): IdentityCard {
  return {
    handle: card.handle,
    kind: card.kind,
    displayName: card.displayName,
    bio: card.bio,
    controller: card.controller,
    links: card.links.map((link) => ({ ...link })),
    likeness: card.likeness ? { ...card.likeness } : undefined,
    voice: card.voice ? { ...card.voice } : undefined,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  };
}

export function validateCardDraft(draft: CardDraft): CardIssue[] {
  const issues: CardIssue[] = [];
  const handleIssue = validateHandle(draft.handle);
  if (handleIssue) issues.push(handleIssue);

  if (draft.kind !== "person" && draft.kind !== "agent") {
    issues.push({ field: "kind", message: "Kind must be person or agent." });
  }

  const displayName = draft.displayName.trim();
  if (displayName.length < 1 || displayName.length > 80) {
    issues.push({
      field: "displayName",
      message: "Display name must be 1–80 characters.",
    });
  }

  const bio = (draft.bio ?? "").trim();
  if (bio.length > 500) {
    issues.push({ field: "bio", message: "Bio must be 500 characters or fewer." });
  }

  if (draft.kind === "agent") {
    const controller = (draft.controller ?? "").trim();
    if (controller) {
      const controllerIssue = validateHandle(controller);
      if (controllerIssue) {
        issues.push({
          field: "controller",
          message: "Controller must be a valid handle.",
        });
      }
    }
  } else if (draft.controller) {
    issues.push({
      field: "controller",
      message: "Only agent cards may name a controller.",
    });
  }

  for (const [index, link] of (draft.links ?? []).entries()) {
    if (!link.label.trim()) {
      issues.push({ field: `links.${index}.label`, message: "Link label is required." });
    }
    try {
      const url = new URL(link.url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        issues.push({ field: `links.${index}.url`, message: "Link must be http(s)." });
      }
    } catch {
      issues.push({ field: `links.${index}.url`, message: "Link must be a valid URL." });
    }
  }

  return issues;
}

export function stampCard(
  draft: CardDraft,
  timestamps?: { createdAt?: string; updatedAt?: string },
): IdentityCard {
  const now = new Date().toISOString();
  return {
    handle: normalizeHandle(draft.handle),
    kind: draft.kind,
    displayName: draft.displayName.trim(),
    bio: (draft.bio ?? "").trim(),
    controller:
      draft.kind === "agent" && draft.controller
        ? normalizeHandle(draft.controller)
        : undefined,
    links: (draft.links ?? [])
      .filter((link) => link.label.trim() && link.url.trim())
      .map((link) => ({ label: link.label.trim(), url: link.url.trim() })),
    likeness: draft.likeness?.tool
      ? {
          tool: draft.likeness.tool.trim(),
          note: draft.likeness.note?.trim() || undefined,
          url: draft.likeness.url?.trim() || undefined,
        }
      : undefined,
    voice: draft.voice?.tool
      ? {
          tool: draft.voice.tool.trim(),
          note: draft.voice.note?.trim() || undefined,
          url: draft.voice.url?.trim() || undefined,
        }
      : undefined,
    createdAt: timestamps?.createdAt ?? now,
    updatedAt: timestamps?.updatedAt ?? now,
  };
}
