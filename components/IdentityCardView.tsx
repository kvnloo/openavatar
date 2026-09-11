import Link from "next/link";
import { type IdentityCard } from "@/lib/card";
import { studioTool } from "@/lib/studio";

export function IdentityCardView({
  card,
  href,
}: {
  card: IdentityCard;
  href?: string;
}) {
  const inner = (
    <article className="oa-card" data-kind={card.kind}>
      <div className="relative z-[1] flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <p className="font-[family-name:var(--font-ibm)] text-[0.65rem] tracking-[0.22em] uppercase">
            Open Identity Card
          </p>
          <p className="font-[family-name:var(--font-ibm)] text-[0.65rem] tracking-[0.18em] uppercase">
            {card.kind}
          </p>
        </div>
        <div>
          <p className="font-[family-name:var(--font-ibm)] text-sm">@{card.handle}</p>
          <h2 className="mt-1 text-3xl leading-none">{card.displayName}</h2>
          {card.bio ? <p className="mt-3 max-w-prose text-sm leading-6">{card.bio}</p> : null}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3 text-xs">
          <div className="flex flex-wrap gap-2">
            {card.likeness ? (
              <span className="rounded-full border border-[var(--rule)] px-2 py-1">
                likeness · {studioTool(card.likeness.tool)?.name ?? card.likeness.tool}
              </span>
            ) : null}
            {card.voice ? (
              <span className="rounded-full border border-[var(--rule)] px-2 py-1">
                voice · {studioTool(card.voice.tool)?.name ?? card.voice.tool}
              </span>
            ) : null}
            {card.controller ? (
              <span className="rounded-full border border-[var(--rule)] px-2 py-1">
                controller · @{card.controller}
              </span>
            ) : null}
          </div>
          <span className="font-[family-name:var(--font-ibm)]">
            {card.createdAt.slice(0, 10)}
          </span>
        </div>
      </div>
    </article>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="block no-underline">
      {inner}
    </Link>
  );
}
