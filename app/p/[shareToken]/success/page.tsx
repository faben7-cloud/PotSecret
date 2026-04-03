import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCopy } from "@/lib/getCopy";
import { getPublicPotByToken } from "@/lib/pots";
import { getStripe } from "@/lib/stripe";
import { eventTypeLabel, formatCurrency } from "@/lib/utils";

const copy = getCopy();
export default async function PublicPotSuccessPage({
  params,
  searchParams
}: {
  params: Promise<{ shareToken: string }>;
  searchParams?: Promise<{ session_id?: string }>;
}) {
  const { shareToken } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pot = await getPublicPotByToken(shareToken);

  if (!pot) {
    notFound();
  }

  const sessionId = resolvedSearchParams?.session_id;
  const stripe = getStripe();
  const admin = createSupabaseAdminClient();

  let session:
    | Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>>
    | null = null;
  let sessionError = "";

  if (!sessionId) {
    sessionError = copy.errors.missingStripeSession;
  } else {
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch {
      sessionError = copy.errors.stripeSessionVerificationFailed;
    }
  }

  if (session && session.metadata?.share_token !== shareToken) {
    notFound();
  }

    const { data: contribution } =
    sessionId
      ? await admin
          .from("contributions")
          .select("status, amount, currency, contributor_display_name, is_anonymous")
          .eq("stripe_checkout_session_id", sessionId)
          .maybeSingle()
      : { data: null };
      
  const paymentIsPaid = session?.payment_status === "paid";
  const contributionIsConfirmed = contribution?.status === "confirmed";
  const contributionAmount = session?.amount_total ?? contribution?.amount ?? null;
  const contributionCurrency = (session?.currency ?? contribution?.currency ?? pot.currency).toUpperCase();
  const contributorName = contribution?.is_anonymous
    ? null
    : contribution?.contributor_display_name || session?.metadata?.contributor_display_name || null;

  const statusBadge = paymentIsPaid
    ? copy.success.paymentReceived
    : sessionError
      ? copy.success.verificationFailed
      : copy.success.verificationPending;
  const statusMessage = sessionError
    ? sessionError
    : contributionIsConfirmed
      ? copy.publicPotSuccess.statusMessage.confirmed
      : paymentIsPaid
        ? copy.publicPotSuccess.statusMessage.paidPending
        : copy.publicPotSuccess.statusMessage.unpaid;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center py-8">
      <div className="w-full rounded-[2rem] border border-white/60 bg-white/95 p-7 shadow-card sm:p-9">
        <span className="rounded-full bg-pine/10 px-3 py-1 text-xs font-semibold normal-case tracking-[0.16em] text-pine">
          {statusBadge}
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {`${copy.publicPotSuccess.titlePrefix} ${pot.title}`}
        </h1>
        <p className="mt-3 text-base leading-7 text-ink/72">{statusMessage}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.5rem] bg-mist p-5">
            <p className="text-xs normal-case tracking-[0.16em] text-ink/50">{copy.publicPotSuccess.potLabel}</p>
            <p className="mt-2 text-lg font-semibold text-ink">{pot.title}</p>
            <p className="mt-2 text-sm text-ink/65">{eventTypeLabel[pot.event_type]}</p>
          </div>

          <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-ink/8">
            <p className="text-xs normal-case tracking-[0.16em] text-ink/50">{copy.publicPotSuccess.amountLabel}</p>
            <p className="mt-2 text-lg font-semibold text-ink">
              {contributionAmount !== null ? formatCurrency(contributionAmount, contributionCurrency) : copy.publicPotSuccess.unavailableAmount}
            </p>
            <p className="mt-2 text-sm text-ink/65">
              {contribution?.is_anonymous
                ? copy.publicPotSuccess.anonymousContribution
                : contributorName
                  ? `${copy.publicPotSuccess.displayedNamePrefix}: ${contributorName}`
                  : copy.publicPotSuccess.noDisplayedName}
            </p>
          </div>
        </div>

        {sessionId ? (
          <div className="mt-4 rounded-[1.5rem] border border-ink/10 bg-white p-5">
            <p className="text-xs normal-case tracking-[0.16em] text-ink/50">{copy.publicPotSuccess.stripeReference}</p>
            <p className="mt-3 break-all text-sm leading-6 text-ink/78">{sessionId}</p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/p/${shareToken}`}
            className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white hover:bg-coral/90"
          >
            {copy.buttons.backToPot}
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
