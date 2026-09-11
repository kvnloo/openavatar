import Link from "next/link";
import { STUDIO_TOOLS } from "@/lib/studio";

export default function StudioPage() {
  return (
    <main className="mx-auto grid w-full max-w-4xl gap-10 px-5 pb-24 pt-6 md:px-10">
      <div>
        <p className="eyebrow">Local assembly</p>
        <h1 className="mt-3 text-4xl">Likeness and voice studio</h1>
        <p className="mt-3 max-w-2xl leading-7 text-mist">
          Open Avatar does not host your face or your voice. Attach a tool you already
          run. The card stores a pointer. The files stay with you.
        </p>
      </div>
      <div className="grid gap-5">
        {STUDIO_TOOLS.map((tool) => (
          <article
            key={tool.id}
            className="grid gap-3 rounded-2xl border border-white/10 p-6 md:grid-cols-[1fr_auto]"
          >
            <div>
              <p className="eyebrow">
                {tool.surface} · {tool.local ? "local" : "hosted"}
              </p>
              <h2 className="mt-2 text-2xl">{tool.name}</h2>
              <p className="mt-2 leading-7 text-mist">{tool.summary}</p>
              <p className="mt-3 text-sm leading-6 text-mist">{tool.recipe}</p>
            </div>
            <Link className="btn btn-ghost h-fit self-start" href={tool.url}>
              Upstream
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
