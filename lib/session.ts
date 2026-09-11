import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "oa_session";

function secret(): string {
  return process.env.OPENAVATAR_SESSION_SECRET ?? "dev-only-openavatar-session";
}

function sign(handle: string): string {
  const hmac = createHmac("sha256", secret()).update(handle).digest("base64url");
  return `${handle}.${hmac}`;
}

function verify(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const handle = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(handle).digest("base64url");
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return handle;
}

export async function readSessionHandle(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

export async function writeSession(handle: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sign(handle), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
