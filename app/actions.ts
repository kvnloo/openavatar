"use server";

import { redirect } from "next/navigation";
import { type EntityKind } from "@/lib/card";
import { clearSession, readSessionHandle, writeSession } from "@/lib/session";
import { authenticate, claimCard, StoreError, updateCard } from "@/lib/store";
import { STUDIO_TOOLS } from "@/lib/studio";

export type ActionState = { error?: string };

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function parseLinks(raw: string) {
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

function pointerFromForm(formData: FormData, kind: "likeness" | "voice") {
  const tool = formString(formData, kind);
  if (!tool) return undefined;
  if (!STUDIO_TOOLS.some((item) => item.id === tool)) return undefined;
  const note = formString(formData, `${kind}Note`);
  return { tool, note: note || undefined };
}

export async function claimIdentity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const kind = formString(formData, "kind") as EntityKind;
  try {
    const card = await claimCard(
      {
        handle: formString(formData, "handle"),
        kind,
        displayName: formString(formData, "displayName"),
        bio: formString(formData, "bio"),
        controller: formString(formData, "controller") || undefined,
      },
      formString(formData, "passphrase"),
    );
    await writeSession(card.handle);
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
  redirect("/me");
}

export async function loginIdentity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  try {
    const card = await authenticate(
      formString(formData, "handle"),
      formString(formData, "passphrase"),
    );
    await writeSession(card.handle);
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
  redirect("/me");
}

export async function logoutIdentity(): Promise<void> {
  await clearSession();
  redirect("/");
}

export async function saveIdentity(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const handle = await readSessionHandle();
  if (!handle) return { error: "Sign in to edit your card." };
  try {
    await updateCard(handle, {
      displayName: formString(formData, "displayName"),
      bio: formString(formData, "bio"),
      controller: formString(formData, "controller") || undefined,
      links: parseLinks(formString(formData, "links")),
      likeness: pointerFromForm(formData, "likeness"),
      voice: pointerFromForm(formData, "voice"),
    });
  } catch (error) {
    if (error instanceof StoreError) return { error: error.message };
    throw error;
  }
  redirect(`/c/${handle}`);
}
