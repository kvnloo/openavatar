import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto grid w-full max-w-xl gap-8 px-5 pb-24 pt-6 md:px-10">
      <div>
        <p className="eyebrow">Return</p>
        <h1 className="mt-3 text-4xl">Sign in</h1>
        <p className="mt-3 leading-7 text-mist">
          Use the handle you claimed. Sample cards in the directory are read-only.
        </p>
      </div>
      <LoginForm />
      <p className="text-sm text-mist">
        No card yet? <Link href="/claim">Claim a handle</Link>.
      </p>
    </main>
  );
}
