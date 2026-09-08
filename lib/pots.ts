import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CheckoutPot } from "@/lib/payment-security";
import type { PotRevealContribution, PublicPot, PotSummary } from "@/types/database";

export async function getMyPots() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.rpc("list_my_pots");
  if (error) throw new Error(error.message);
  return (data ?? []) as PotSummary[];
}

export async function getMyPotContributions(potId: string) {
  const supabase = await createSupabaseServerClient();
  if (!potId || potId.includes("[") || potId.includes("%")) throw new Error("Invalid potId");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: pot, error: potError } = await supabase.from("pots").select("id, owner_user_id").eq("id", potId).eq("owner_user_id", user.id).maybeSingle();
  if (potError) throw new Error(potError.message);
  if (!pot) return [];
  const { data, error } = await supabase.from("contributions").select("*").eq("pot_id", potId).eq("status", "confirmed").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPublicPotByToken(shareToken: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_pot_by_share_token", { p_share_token: shareToken });
  if (error) throw new Error(error.message);
  return ((data ?? [])[0] as PublicPot | undefined) ?? null;
}

export async function getPublicPotRevealContributions(shareToken: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_public_pot_reveal_contributions", { p_share_token: shareToken });
  if (error) throw new Error(error.message);
  return (data ?? []) as PotRevealContribution[];
}

// Checkout never uses the public RPC. This server-only lookup supplies the canonical pot record.
export async function getPotForCheckoutByShareToken(shareToken: string): Promise<CheckoutPot | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from("pots")
    .select("id, title, currency, status")
    .eq("share_token", shareToken)
    .maybeSingle();
  if (error) throw new Error("checkout_pot_lookup_failed");
  return (data as CheckoutPot | null) ?? null;
}

export async function getPotById(potId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("pots").select("*").eq("id", potId).eq("owner_user_id", user.id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
