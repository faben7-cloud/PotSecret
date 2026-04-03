import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const COMMISSION_PERCENT = 0.04;

export default async function PayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: pot } = await supabase
    .from("pots")
    .select("*")
    .eq("id", id)
    .single();

  if (!pot) notFound();

  const { data: contributions } = await supabase
    .from("contributions")
    .select("amount")
    .eq("pot_id", id)
    .eq("status", "confirmed");

  const total = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0;
  const commission = Math.round(total * COMMISSION_PERCENT);
  const net = total - commission;

  const format = (v: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: pot.currency
    }).format(v / 100);

  async function markAsPaid() {
    "use server";

    const supabase = await createSupabaseServerClient();

    await supabase.from("payouts").insert({
      pot_id: id,
      gross_amount: total,
      commission_amount: commission,
      net_amount: net,
      status: "paid",
      paid_at: new Date().toISOString()
    });
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Payout bénéficiaire</h1>

      <div className="space-y-2">
        <p><strong>Bénéficiaire :</strong> {pot.beneficiary_name}</p>
        <p><strong>IBAN :</strong> {pot.beneficiary_iban || "Non renseigné"}</p>
      </div>

      <div className="space-y-2">
        <p>Total : {format(total)}</p>
        <p>Commission : {format(commission)}</p>
        <p className="font-semibold text-lg">Net : {format(net)}</p>
      </div>

      <form action={markAsPaid}>
        <button className="bg-green-600 text-white px-4 py-2 rounded-full">
          Marquer comme versé
        </button>
      </form>

      <p className="text-sm text-gray-500">
        ⚠️ Faire le virement bancaire manuellement au bénéficiaire
      </p>
    </div>
  );
}