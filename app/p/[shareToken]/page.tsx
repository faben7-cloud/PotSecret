import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ContributionForm } from "@/components/pot/contribution-form";

type Variant = "A" | "B";

export default async function PublicPotPage({
  params,
  searchParams
}: {
  params: Promise<{ shareToken: string }>;
  searchParams?: Promise<{ v?: string }>;
}) {
  const { shareToken } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const rawVariant = resolvedSearchParams?.v?.toUpperCase();
  const variant: Variant = rawVariant === "B" ? "B" : "A";

  const supabase = await createSupabaseServerClient();

  const { data: pot } = await supabase
    .from("pots")
    .select("*")
    .eq("share_token", shareToken)
    .maybeSingle();

  if (!pot) notFound();

  const { data: contributions } = await supabase
    .from("contributions")
    .select("*")
    .eq("pot_id", pot.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  const safeContributions = contributions ?? [];

  const total =
    safeContributions.reduce((sum, c) => sum + (c.amount || 0), 0) ?? 0;

  const count = safeContributions.length;

  const format = (v: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: pot.currency
    }).format(v / 100);

  const contributionIsOpen = pot.status === "open";

  const latestMessage =
    safeContributions.find((c) => c.message_body?.trim())?.message_body ||
    "Participez à la surprise 🎁";

  // =========================
  // VERSION A (simple)
  // =========================
  if (variant === "A") {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-8">

        <h1 className="text-3xl font-semibold">{pot.title}</h1>

        <p className="text-gray-600">
          {pot.description || "Une belle surprise se prépare 🎁"}
        </p>

        <div className="border rounded-xl p-4 bg-gray-50">
          <p className="text-sm text-gray-500">Total collecté</p>
          <p className="text-2xl font-semibold">{format(total)}</p>
          <p className="text-sm text-gray-500 mt-1">
            {count} participant{count > 1 ? "s" : ""}
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Messages</h2>

          {safeContributions.length === 0 && (
            <p className="text-sm text-gray-500">
              Aucun message pour le moment
            </p>
          )}

          {safeContributions.map((c) => (
            <div key={c.id} className="border rounded-xl p-4 space-y-1">
              <p className="font-medium">
                {c.is_anonymous
                  ? "Anonyme"
                  : c.contributor_display_name || "Participant"}
              </p>

              {c.message_body && (
                <p className="text-sm text-gray-600">
                  {c.message_body}
                </p>
              )}

              <p className="text-xs text-gray-400">
                {new Date(c.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <div className="border rounded-xl p-6">
          <ContributionForm
            shareToken={pot.share_token}
            currency={pot.currency}
            disabled={!contributionIsOpen}
          />
        </div>

      </div>
    );
  }

  // =========================
  // VERSION B (conversion)
  // =========================
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-10">

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">
          🎉 {pot.title}
        </h1>

        <p className="text-lg text-gray-600">
          {pot.description || "Une surprise se prépare... 🤫"}
        </p>

        <div className="flex justify-center gap-6 mt-4">
          <div>
            <p className="text-2xl font-semibold">{format(total)}</p>
            <p className="text-sm text-gray-500">collectés</p>
          </div>

          <div>
            <p className="text-2xl font-semibold">{count}</p>
            <p className="text-sm text-gray-500">participants</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <a
          href="#participer"
          className="bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg"
        >
          Participer maintenant
        </a>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Ils ont déjà participé
        </h2>

        {safeContributions.slice(0, 4).map((c) => (
          <div key={c.id} className="border rounded-lg p-4">
            <p className="font-medium">
              {c.is_anonymous
                ? "Anonyme"
                : c.contributor_display_name || "Participant"}
            </p>

            {c.message_body && (
              <p className="text-gray-600 text-sm mt-1">
                {c.message_body}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border p-4 rounded-lg text-center">
        <p className="font-semibold">
          ⚡ Plus que quelques jours pour participer
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {latestMessage}
        </p>
      </div>

      <div id="participer" className="border rounded-xl p-6 shadow">
        <ContributionForm
          shareToken={pot.share_token}
          currency={pot.currency}
          disabled={!contributionIsOpen}
        />
      </div>

      <div className="text-center text-sm text-gray-500 space-y-1">
        <p>🔒 Paiement sécurisé via Stripe</p>
        <p>🙈 Montants discrets entre participants</p>
        <p>⚡ Participation en 30 secondes</p>
      </div>

    </div>
  );
}