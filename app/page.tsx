import Link from "next/link";
import { IdentityCardView } from "@/components/IdentityCardView";
import { getPublicCard, listPublicCards } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured =
    (await getPublicCard("example")) ?? (await listPublicCards()).at(0) ?? null;
  const agent = await getPublicCard("hermes");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-5 pb-24 pt-6 md:px-10">
      <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="eyebrow">Bureau of public identity</p>
          <h1 className="mt-4 max-w-xl text-5xl leading-[1.05] md:text-6xl">
            Claim a handle. Keep the face and voice on your machine.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-mist">
            Open Avatar is a thin public identity card for people and agents. Likeness
            and speech are assembled from tools you already run locally — Kokoro,
            Whisper, InstantID, LivePortrait — not a new model we host.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn" href="/claim">
              Claim a handle
            </Link>
            <Link className="btn btn-ghost" href="/directory">
              Browse cards
            </Link>
          </div>
        </div>
        <div className="grid gap-6">
          {featured ? <IdentityCardView card={featured} href={`/c/${featured.handle}`} /> : null}
          {agent ? <IdentityCardView card={agent} href={`/c/${agent.handle}`} /> : null}
        </div>
      </section>
      <section className="grid gap-8 md:grid-cols-3">
        {[
          {
            title: "Claim",
            body: "A handle is the product. Sign up with a passphrase. No waitlist. No vendor required.",
          },
          {
            title: "Card",
            body: "The public page is the Open Identity Card. People and agents share the same object.",
          },
          {
            title: "Studio",
            body: "We do not train on your face. The studio is a catalog of local tools plus a pointer on the card.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-white/10 p-6">
            <p className="eyebrow">{item.title}</p>
            <p className="mt-3 leading-7 text-mist">{item.body}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
