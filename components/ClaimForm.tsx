"use client";

import { useActionState } from "react";
import { claimIdentity, type ActionState } from "@/app/actions";

const initial: ActionState = {};

export function ClaimForm() {
  const [state, action, pending] = useActionState(claimIdentity, initial);

  return (
    <form action={action} className="grid gap-5">
      {state.error ? (
        <p className="rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {state.error}
        </p>
      ) : null}
      <label className="field">
        <span className="eyebrow">Handle</span>
        <input name="handle" required placeholder="ada" autoComplete="username" />
      </label>
      <label className="field">
        <span className="eyebrow">Kind</span>
        <select name="kind" defaultValue="person">
          <option value="person">Person</option>
          <option value="agent">Agent</option>
        </select>
      </label>
      <label className="field">
        <span className="eyebrow">Display name</span>
        <input name="displayName" required placeholder="Ada Lovelace" />
      </label>
      <label className="field">
        <span className="eyebrow">Bio</span>
        <textarea name="bio" placeholder="One short public line." />
      </label>
      <label className="field">
        <span className="eyebrow">Controller handle (agents only)</span>
        <input name="controller" placeholder="example" />
      </label>
      <label className="field">
        <span className="eyebrow">Passphrase</span>
        <input
          name="passphrase"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Claiming…" : "Claim this identity"}
      </button>
    </form>
  );
}
