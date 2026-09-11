"use client";

import { useActionState } from "react";
import { loginIdentity, type ActionState } from "@/app/actions";

const initial: ActionState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginIdentity, initial);

  return (
    <form action={action} className="grid gap-5">
      {state.error ? (
        <p className="rounded-lg border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {state.error}
        </p>
      ) : null}
      <label className="field">
        <span className="eyebrow">Handle</span>
        <input name="handle" required autoComplete="username" />
      </label>
      <label className="field">
        <span className="eyebrow">Passphrase</span>
        <input
          name="passphrase"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
