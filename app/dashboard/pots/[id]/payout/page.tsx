import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculateBeneficiaryPayoutBreakdown } from "@/lib/payouts";
import { formatCurrency } from "@/lib/utils";

async function getPayoutContext(id: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: pot } = await supabase
    .from("pots")
    .select("*")
    .eq("id", id)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (!pot) {
    return null;
  }

  const [{ data: contributions }, { data: payouts }] = await Promise.all([
    supabase
      .from("contributions")
      .select("amount")
      .eq("pot_id", id)
      .eq("status", "confirmed"),
    supabase
      .from("payouts")
      .select("*")
      .eq("pot_id", id)
      .order("paid_at", { ascending: false })
  ]);

  const confirmedTotalCents = contributions?.reduce((sum, contribution) => sum + (contribution.amount || 0), 0) ?? 0;
  const paidGrossCents = payouts?.reduce((sum, payout) => sum + (payout.gross_amount || 0), 0) ?? 0;
  const paidCommissionCents = payouts?.reduce((sum, payout) => sum + (payout.commission_amount || 0), 0) ?? 0;
  const paidNetCents = payouts?.reduce((sum, payout) => sum + (payout.net_amount || 0), 0) ?? 0;
  const remainingGrossCents = Math.max(confirmedTotalCents - paidGrossCents, 0);
  const remainingBreakdown = calculateBeneficiaryPayoutBreakdown(remainingGrossCents);

  return {
    pot,
    payouts: payouts ?? [],
    confirmedTotalCents,
    paidGrossCents,
    paidCommissionCents,
    paidNetCents,
    remainingGrossCents,
    remainingBreakdown
  };
}

export default async function PayoutPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const context = await getPayoutContext(id, user.id);

  if (!context) {
    notFound();
  }

  const {
    pot,
    payouts,
    confirmedTotalCents,
    paidCommissionCents,
    paidNetCents,
    remainingGrossCents,
    remainingBreakdown
  } = context;
  const beneficiaryIban = pot.beneficiary_iban?.trim() ?? "";
  const payoutBlockedByMissingIban = beneficiaryIban.length === 0;

  async function markAsPaid() {
    "use server";

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/connexion");
    }

    const latestContext = await getPayoutContext(id, user.id);

    if (!latestContext || latestContext.remainingGrossCents <= 0) {
      revalidatePath(`/dashboard/pots/${id}`);
      revalidatePath(`/dashboard/pots/${id}/payout`);
      return;
    }

    const beneficiaryIban = latestContext.pot.beneficiary_iban?.trim() ?? "";

    if (!beneficiaryIban) {
      revalidatePath(`/dashboard/pots/${id}`);
      revalidatePath(`/dashboard/pots/${id}/payout`);
      return;
    }

    const { remainingGrossCents, remainingBreakdown } = latestContext;

    const { error } = await supabase.from("payouts").insert({
      pot_id: id,
      gross_amount: remainingGrossCents,
      commission_amount: remainingBreakdown.commissionAmountCents,
      net_amount: remainingBreakdown.netAmountCents,
      status: "paid",
      paid_at: new Date().toISOString()
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/dashboard/pots/${id}`);
    revalidatePath(`/dashboard/pots/${id}/payout`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium normal-case tracking-[0.16em] text-coral">Versement bénéficiaire</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">{pot.title}</h1>
        </div>
        <Link
          href={`/dashboard/pots/${id}`}
          className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink/20"
        >
          Retour au pot
        </Link>
      </div>

      <section className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
        <div className="space-y-2">
          <p>
            <strong>Bénéficiaire :</strong> {pot.beneficiary_name || "Non renseigné"}
          </p>
          <p>
            <strong>IBAN :</strong> {beneficiaryIban || "Non renseigné"}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
          <p className="text-sm text-ink/60">Total validé</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{formatCurrency(confirmedTotalCents, pot.currency)}</p>
        </div>
        <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
          <p className="text-sm text-ink/60">Déjà versé</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{formatCurrency(paidNetCents, pot.currency)}</p>
        </div>
        <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
          <p className="text-sm text-ink/60">Commission retenue</p>
          <p className="mt-3 text-3xl font-semibold text-ink">{formatCurrency(paidCommissionCents, pot.currency)}</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Versement à effectuer</h2>

        <div className="mt-5 space-y-3 text-sm text-ink/75">
          <div className="flex items-center justify-between gap-4">
            <span>Montant brut restant</span>
            <strong className="text-ink">{formatCurrency(remainingGrossCents, pot.currency)}</strong>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Commission plateforme 4 %</span>
            <strong className="text-ink">
              {formatCurrency(remainingBreakdown.commissionAmountCents, pot.currency)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-4 text-base">
            <span>Montant net à verser</span>
            <strong className="text-ink">{formatCurrency(remainingBreakdown.netAmountCents, pot.currency)}</strong>
          </div>
        </div>

        <form action={markAsPaid} className="mt-6">
          <button
            disabled={remainingGrossCents <= 0 || payoutBlockedByMissingIban}
            className="rounded-full bg-[#14B8A6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f9f90] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {payoutBlockedByMissingIban
              ? "IBAN bénéficiaire requis"
              : remainingGrossCents > 0
                ? "Marquer comme versé"
                : "Aucun versement restant"}
          </button>
        </form>

        <p className="mt-4 text-sm text-ink/60">
          La commission de 4 % est retenue uniquement au moment du versement bénéficiaire, sur le total confirmé restant à payer.
        </p>

        {payoutBlockedByMissingIban ? (
          <p className="mt-3 text-sm font-medium text-red-600">
            Ajoute un IBAN bénéficiaire avant d’enregistrer un versement.
          </p>
        ) : null}
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
        <h2 className="text-2xl font-semibold text-ink">Historique des versements</h2>

        <div className="mt-5 space-y-4">
          {payouts.length > 0 ? (
            payouts.map((payout) => (
              <article key={payout.id} className="rounded-[1.5rem] bg-mist p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-ink/70">
                    {`Versé le ${new Date(payout.paid_at).toLocaleString("fr-FR")}`}
                  </p>
                  <p className="text-base font-semibold text-ink">{formatCurrency(payout.net_amount, pot.currency)}</p>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-ink/70 sm:grid-cols-3">
                  <span>{`Brut : ${formatCurrency(payout.gross_amount, pot.currency)}`}</span>
                  <span>{`Commission : ${formatCurrency(payout.commission_amount, pot.currency)}`}</span>
                  <span>{`Net : ${formatCurrency(payout.net_amount, pot.currency)}`}</span>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.5rem] bg-mist p-5 text-sm text-ink/60">
              Aucun versement n’a encore été enregistré pour ce pot.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
