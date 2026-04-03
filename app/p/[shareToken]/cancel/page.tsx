import Link from "next/link";
import { notFound } from "next/navigation";
import { getCopy } from "@/lib/getCopy";
import { getPublicPotByToken } from "@/lib/pots";

const copy = getCopy();
export default async function PublicPotCancelPage({
  params
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const pot = await getPublicPotByToken(shareToken);

  if (!pot) {
    notFound();
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center py-8">
      <div className="w-full rounded-[2rem] border border-white/60 bg-white/95 p-7 shadow-card sm:p-9">
        <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold normal-case tracking-[0.16em] text-ink/70">
          {copy.publicPotCancel.badge}
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {`${copy.publicPotCancel.titlePrefix} ${pot.title}`}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink/72">{copy.publicPotCancel.body}</p>

        <div className="mt-8 rounded-[1.5rem] bg-mist p-5 text-sm leading-6 text-ink/72">
          {copy.publicPotCancel.info}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/p/${shareToken}`}
            className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white hover:bg-coral/90"
          >
            {copy.buttons.resumeContribution}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-ink/20"
          >
            {copy.buttons.backHome}
          </Link>
        </div>
      </div>
    </div>
  );
}




