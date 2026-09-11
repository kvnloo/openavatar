"use client";

import { useActionState } from "react";
import { saveIdentity, type ActionState } from "@/app/actions";
import { type IdentityCard } from "@/lib/card";
import { STUDIO_TOOLS } from "@/lib/studio";

const initial: ActionState = {};

function linksText(card: IdentityCard): string {
  return card.links.map((link) => `${link.label} ${link.url}`).join("\n");
}

export function EditCardForm({ card }: { card: IdentityCard }) {
  const [state, action, pending] = useActionState(saveIdentity, initial);
  const likenessTools = STUDIO_TOOLS.filter((tool) => tool.surface !== "voice");
  const voiceTools = STUDIO_TOOLS.filter((tool) => tool.surface !== "likeness");

  return (
    <form action={action} className="grid gap-5">
      {state.error ? (
        <p className="rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {state.error}
        </p>
      ) : null}
      <label className="field">
        <span className="eyebrow">Display name</span>
        <input name="displayName" required defaultValue={card.displayName} />
      </label>
      <label className="field">
        <span className="eyebrow">Bio</span>
        <textarea name="bio" defaultValue={card.bio} />
      </label>
      {card.kind === "agent" ? (
        <label className="field">
          <span className="eyebrow">Controller handle</span>
          <input name="controller" defaultValue={card.controller ?? ""} />
        </label>
      ) : null}
      <label className="field">
        <span className="eyebrow">Links (label url, one per line)</span>
        <textarea name="links" defaultValue={linksText(card)} />
      </label>
      <label className="field">
        <span className="eyebrow">Likeness tool</span>
        <select name="likeness" defaultValue={card.likeness?.tool ?? ""}>
          <option value="">None — keep it local, unpublished</option>
          {likenessTools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="eyebrow">Likeness note</span>
        <input name="likenessNote" defaultValue={card.likeness?.note ?? ""} />
      </label>
      <label className="field">
        <span className="eyebrow">Voice tool</span>
        <select name="voice" defaultValue={card.voice?.tool ?? ""}>
          <option value="">None</option>
          {voiceTools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="eyebrow">Voice note</span>
        <input name="voiceNote" defaultValue={card.voice?.note ?? ""} />
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Publish card"}
      </button>
    </form>
  );
}
