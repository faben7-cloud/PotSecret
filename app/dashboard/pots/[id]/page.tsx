import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function PotDetailPage({ params }: PageProps) {
  const potId = params.id;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: pot, error: potError } = await supabase
    .from("pots")
    .select("*")
    .eq("id", potId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (potError) {
    throw new Error(potError.message);
  }

  if (!pot) {
    notFound();
  }

  const { data: contributions, error: contributionsError } = await supabase
    .from("contributions")
    .select("*")
    .eq("pot_id", potId)
    .order("created_at", { ascending: false });

  if (contributionsError) {
    throw new Error(contributionsError.message);
  }

  const safeContributions = contributions ?? [];

  const total = safeContributions.reduce(
    (sum, contribution) => sum + (contribution.amount ?? 0),
    0
  );

  const contributionCount = safeContributions.length;
  const average =
    contributionCount > 0 ? Math.round(total / contributionCount) : 0;

  const formatAmount = (amountInCents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: pot.currency ?? "EUR"
    }).format(amountInCents / 100);

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/p/${pot.share_token}`;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium tracking-[0.16em] text-coral">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold text-ink">{pot.title}</h1>
          <p className="text-sm text-ink/70">
            {pot.description || "Aucune description"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-ink/20"
          >
            Retour dashboard
          </Link>

          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white hover:bg-coral/90"
          >
            Ouvrir la page publique
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-sm text-ink/60">Total collecté</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {formatAmount(total)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-sm text-ink/60">Contributions</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {contributionCount}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-sm text-ink/60">Panier moyen</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {formatAmount(average)}
          </p>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-ink/70">Lien public</p>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            readOnly
            value={publicUrl}
            className="w-full rounded-lg border border-ink/10 bg-mist px-3 py-2 text-sm text-ink"
          />
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink/20"
          >
            Tester
          </a>
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-ink">Contributions</h2>

        {safeContributions.length === 0 ? (
          <p className="mt-4 text-sm text-ink/60">
            Aucune contribution pour le moment.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-sm text-ink/50">
                  <th className="pr-4">Participant</th>
                  <th className="pr-4">Montant</th>
                  <th className="pr-4">Statut</th>
                  <th className="pr-4">Message</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {safeContributions.map((contribution) => (
                  <tr
                    key={contribution.id}
                    className="rounded-xl bg-mist text-sm text-ink"
                  >
                    <td className="rounded-l-xl px-4 py-3">
                      {contribution.is_anonymous
                        ? "Anonyme"
                        : contribution.contributor_display_name || "Participant"}
                    </td>
                    <td className="px-4 py-3">
                      {formatAmount(contribution.amount ?? 0)}
                    </td>
                    <td className="px-4 py-3">{contribution.status}</td>
                    <td className="px-4 py-3">
                      {contribution.message_body || "—"}
                    </td>
                    <td className="rounded-r-xl px-4 py-3">
                      {contribution.created_at
                        ? new Date(contribution.created_at).toLocaleString("fr-FR")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}