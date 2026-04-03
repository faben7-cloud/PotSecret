import { getMyPotContributions, getPotById } from "@/lib/pots";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id || id.includes("[") || id.includes("%")) {
    return <div className="p-6 text-red-500">Erreur ID</div>;
  }

  const pot = await getPotById(id);
  if (!pot) return <div className="p-6">Pot introuvable</div>;

  const contributions = await getMyPotContributions(id);

  // =========================
  // 📊 CALCULS
  // =========================
  const total = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  const count = contributions.length;
  const avg = count > 0 ? Math.round(total / count) : 0;

  const COMMISSION = 0.04;
  const commissionAmount = Math.round(total * COMMISSION);
  const net = total - commissionAmount;

  const format = (v: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: pot.currency || "EUR"
    }).format(v / 100);

  // =========================
  // UI
  // =========================
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">{pot.title}</h1>
        <p className="text-sm text-gray-500">
          Cagnotte organisée par vous
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Card title="Total">
          {format(total)}
        </Card>

        <Card title="Participants">
          {count}
        </Card>

        <Card title="Panier moyen">
          {format(avg)}
        </Card>

        <Card title="Net (après commission)">
          {format(net)}
        </Card>

      </div>

      {/* BARRE PROGRESSION */}
      <div className="space-y-2">
        <p className="text-sm text-gray-500">Progression</p>

        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500"
            style={{ width: `${Math.min((total / 50000) * 100, 100)}%` }}
          />
        </div>

        <p className="text-xs text-gray-400">
          Objectif fictif : 500€
        </p>
      </div>

      {/* LISTE CONTRIBUTIONS */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Contributions</h2>

        {contributions.length === 0 && (
          <p className="text-sm text-gray-500">
            Aucune contribution pour le moment
          </p>
        )}

        {contributions.map((c) => (
          <div
            key={c.id}
            className="border rounded-xl p-4 flex justify-between items-start"
          >
            <div>
              <p className="font-medium">
                {c.is_anonymous
                  ? "Anonyme"
                  : c.contributor_display_name || "Participant"}
              </p>

              {c.message_body && (
                <p className="text-sm text-gray-500 mt-1">
                  {c.message_body}
                </p>
              )}

              <p className="text-xs text-gray-400 mt-1">
                {new Date(c.created_at).toLocaleString()}
              </p>
            </div>

            <div className="font-semibold">
              {format(c.amount)}
            </div>
          </div>
        ))}
      </div>

      {/* PAYOUT */}
      <div className="border rounded-xl p-6 space-y-3 bg-gray-50">
        <h2 className="text-lg font-semibold">Paiement bénéficiaire</h2>

        <p className="text-sm">
          Commission : {format(commissionAmount)}
        </p>

        <p className="text-lg font-semibold">
          Net à verser : {format(net)}
        </p>

        <button className="bg-green-600 text-white px-4 py-2 rounded-full">
          Marquer comme versé
        </button>
      </div>

    </div>
  );
}

// =========================
// COMPONENT KPI
// =========================
function Card({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-xl p-4 bg-white">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-lg font-semibold mt-1">{children}</p>
    </div>
  );
}