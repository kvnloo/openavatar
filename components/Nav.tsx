import Link from "next/link";
import { logoutIdentity } from "@/app/actions";

export function Nav({ handle }: { handle: string | null }) {
  return (
    <header className="flex items-center justify-between gap-4 px-5 py-5 md:px-10">
      <Link href="/" className="flex items-baseline gap-3 no-underline">
        <span className="font-[family-name:var(--font-ibm)] text-xs tracking-[0.22em] uppercase text-mist">
          OA
        </span>
        <span className="text-lg">Open Avatar</span>
      </Link>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-mist">
        <Link href="/directory">Directory</Link>
        <Link href="/studio">Studio</Link>
        {handle ? (
          <>
            <Link href="/me">@{handle}</Link>
            <form action={logoutIdentity}>
              <button className="bg-transparent border-0 text-mist cursor-pointer p-0" type="submit">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Sign in</Link>
            <Link href="/claim" className="btn">
              Claim a handle
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
