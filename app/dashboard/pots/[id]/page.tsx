import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function PotDetailPage({ params }: PageProps) {
  try {
    const potId = params.id;

    if (!potId) {
      return (
        <div style={{ padding: 40 }}>
          <h1>Erreur</h1>
          <p>ID du pot manquant.</p>
        </div>
      );
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      return (
        <div style={{ padding: 40 }}>
          <h1>Erreur utilisateur</h1>
          <pre>{JSON.stringify(userError, null, 2)}</pre>
        </div>
      );
    }

    if (!user) {
      return (
        <div style={{ padding: 40 }}>
          <h1>Non connecté</h1>
          <p>Aucun utilisateur connecté.</p>
        </div>
      );
    }

    const { data: pot, error: potError } = await supabase
      .from("pots")
      .select("*")
      .eq("id", potId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (potError) {
      return (
        <div style={{ padding: 40 }}>
          <h1>Erreur lecture pot</h1>
          <pre>{JSON.stringify(potError, null, 2)}</pre>
        </div>
      );
    }

    if (!pot) {
      return (
        <div style={{ padding: 40 }}>
          <h1>Pot introuvable</h1>
          <p>
            Aucun pot trouvé pour cet identifiant, ou ce pot n’appartient pas à
            l’utilisateur connecté.
          </p>
          <p>
            <strong>potId :</strong> {potId}
          </p>
          <p>
            <strong>userId :</strong> {user.id}
          </p>
        </div>
      );
    }

    const { data: contributions, error: contributionsError } = await supabase
      .from("contributions")
      .select("*")
      .eq("pot_id", potId)
      .order("created_at", { ascending: false });

    if (contributionsError) {
      return (
        <div style={{ padding: 40 }}>
          <h1>Erreur lecture contributions</h1>
          <pre>{JSON.stringify(contributionsError, null, 2)}</pre>
        </div>
      );
    }

    const safeContributions = contributions ?? [];
    const total = safeContributions.reduce(
      (sum, contribution) => sum + (contribution.amount ?? 0),
      0
    );

    const formattedTotal = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: pot.currency ?? "EUR"
    }).format(total / 100);

    return (
      <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <h1 style={{ fontSize: 32, marginBottom: 10 }}>{pot.title}</h1>

        <p style={{ color: "#666", marginBottom: 20 }}>
          {pot.description || "Aucune description"}
        </p>

        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24
          }}
        >
          <p>
            <strong>Total collecté :</strong> {formattedTotal}
          </p>
          <p>
            <strong>Nombre de contributions :</strong> {safeContributions.length}
          </p>
          <p>
            <strong>Devise :</strong> {pot.currency}
          </p>
          <p>
            <strong>Statut :</strong> {pot.status}
          </p>
          <p>
            <strong>Share token :</strong> {pot.share_token}
          </p>
        </div>

        <h2 style={{ fontSize: 24, marginBottom: 12 }}>Contributions</h2>

        {safeContributions.length === 0 ? (
          <p>Aucune contribution pour le moment.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {safeContributions.map((contribution) => (
              <div
                key={contribution.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 16
                }}
              >
                <p>
                  <strong>Participant :</strong>{" "}
                  {contribution.is_anonymous
                    ? "Anonyme"
                    : contribution.contributor_display_name || "Participant"}
                </p>
                <p>
                  <strong>Montant :</strong>{" "}
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: pot.currency ?? "EUR"
                  }).format((contribution.amount ?? 0) / 100)}
                </p>
                <p>
                  <strong>Statut :</strong> {contribution.status}
                </p>
                <p>
                  <strong>Message :</strong>{" "}
                  {contribution.message_body || "Aucun message"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    return (
      <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
        <h1>Erreur fatale page pot</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {error instanceof Error ? error.stack || error.message : JSON.stringify(error, null, 2)}
        </pre>
      </div>
    );
  }
}