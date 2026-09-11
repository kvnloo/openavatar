import { ClaimForm } from "@/components/ClaimForm";

export default function ClaimPage() {
  return (
    <main className="mx-auto grid w-full max-w-xl gap-8 px-5 pb-24 pt-6 md:px-10">
      <div>
        <p className="eyebrow">Sign up</p>
        <h1 className="mt-3 text-4xl">Claim a public handle</h1>
        <p className="mt-3 leading-7 text-mist">
          This is the whole account. The handle is the identity. Passphrases stay on
          this host; likeness and voice files never need to.
        </p>
      </div>
      <ClaimForm />
    </main>
  );
}
