import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid max-w-xl gap-4 px-5 py-24">
      <p className="eyebrow">Missing</p>
      <h1 className="text-4xl">No card for that handle.</h1>
      <Link href="/directory">Back to the directory</Link>
    </main>
  );
}
