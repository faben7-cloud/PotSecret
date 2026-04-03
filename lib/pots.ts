import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Récupère les contributions confirmées d'un pot
 */
export async function getMyPotContributions(potId: string) {
  const supabase = await createSupabaseServerClient();

  // 🛑 Sécurité : éviter les erreurs type "[id]" ou "%5Bid"
  if (!potId || potId.includes("[") || potId.includes("%")) {
    console.error("❌ Invalid potId reçu :", potId);
    throw new Error("Invalid potId");
  }

  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("pot_id", potId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Supabase error :", error.message);
    throw new Error(error.message);
  }

  return data ?? [];
}

/**
 * Récupère un pot public via son share token
 */
export async function getPublicPotByToken(shareToken: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("pots")
    .select("*")
    .eq("share_token", shareToken)
    .single();

  if (error) {
    console.error("❌ getPublicPotByToken error :", error.message);
    return null;
  }

  return data;
}

/**
 * Récupère un pot par ID
 */
export async function getPotById(potId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("pots")
    .select("*")
    .eq("id", potId)
    .single();

  if (error) {
    console.error("❌ getPotById error :", error.message);
    return null;
  }

  return data;
}