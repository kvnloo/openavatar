import { notFound } from "next/navigation";
import { IdentityCardView } from "@/components/IdentityCardView";
import { getPublicCard } from "@/lib/store";
import { studioTool } from "@/lib/studio";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const card = await getPublicCard(handle);
  if (!card) return { title: "Card not found · Open Avatar" };
  return {
    title: `@${card.handle} · Open Avatar`,
    description: card.bio || `${card.displayName}'s Open Identity Card`,
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const card = await getPublicCard(handle);
  if (!card) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": card.kind === "agent" ? "SoftwareApplication" : "Person",
    name: card.displayName,
    identifier: card.handle,
    description: card.bio,
    url: `/c/${card.handle}`,
  };

  return (
    <main className="mx-auto grid w-full max-w-3xl gap-10 px-5 pb-24 pt-6 md:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <IdentityCardView card={card} />
      <section className="grid gap-4 text-sm leading-7 text-mist">
        {card.links.length > 0 ? (
          <div>
            <p className="eyebrow">Links</p>
            <ul className="mt-3 grid gap-1">
              {card.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url}>
                    {link.label} — {link.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {card.likeness?.note ? (
          <p>
            Likeness note ({studioTool(card.likeness.tool)?.name ?? card.likeness.tool}):{" "}
            {card.likeness.note}
          </p>
        ) : null}
        {card.voice?.note ? (
          <p>
            Voice note ({studioTool(card.voice.tool)?.name ?? card.voice.tool}):{" "}
            {card.voice.note}
          </p>
        ) : null}
        <p className="font-[family-name:var(--font-ibm)]">
          Machine card: <a href={`/api/cards/${card.handle}`}>/api/cards/{card.handle}</a>
        </p>
      </section>
    </main>
  );
}
