import Link from "next/link";

export function PaymentPageHeader({ shareToken }: Readonly<{ shareToken?: string }>) {
  const href = shareToken ? `/p/${shareToken}` : "/";

  return (
    <header className="border-b border-[#14B8A6]/10 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[#111827]">
          PotSecret
        </Link>
        <Link
          href={href}
          className="text-sm font-medium text-[#0F766E] transition hover:text-[#14B8A6]"
        >
          Retour à la cagnotte
        </Link>
      </div>
    </header>
  );
}
