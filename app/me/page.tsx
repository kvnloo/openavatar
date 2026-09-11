import Link from "next/link";
import { redirect } from "next/navigation";
import { EditCardForm } from "@/components/EditCardForm";
import { IdentityCardView } from "@/components/IdentityCardView";
import { readSessionHandle } from "@/lib/session";
import { getPublicCard } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const handle = await readSessionHandle();
  if (!handle) redirect("/login");
  const card = await getPublicCard(handle);
  if (!card) redirect("/claim");

  return (
    <main className="mx-auto grid w-full max-w-5xl gap-10 px-5 pb-24 pt-6 md:grid-cols-2 md:px-10">
      <div className="grid gap-5">
        <div>
          <p className="eyebrow">Your card</p>
          <h1 className="mt-3 text-4xl">@{card.handle}</h1>
          <p className="mt-3 leading-7 text-mist">
            Public at <Link href={`/c/${card.handle}`}>/c/{card.handle}</Link>. Attach
            studio tools without uploading media.
          </p>
        </div>
        <IdentityCardView card={card} href={`/c/${card.handle}`} />
      </div>
      <EditCardForm card={card} />
    </main>
  );
}
