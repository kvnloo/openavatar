import { IdentityCardView } from "@/components/IdentityCardView";
import { listPublicCards } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function DirectoryPage() {
  const cards = await listPublicCards();
  return (
    <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-24 pt-6 md:px-10">
      <div>
        <p className="eyebrow">Public registry</p>
        <h1 className="mt-3 text-4xl">Directory</h1>
        <p className="mt-3 max-w-2xl leading-7 text-mist">
          Every claimed handle is a card. JSON is at <code>/api/cards/:handle</code>.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        {cards.map((card) => (
          <IdentityCardView key={card.handle} card={card} href={`/c/${card.handle}`} />
        ))}
      </div>
    </main>
  );
}
