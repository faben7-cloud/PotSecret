import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getMyPots() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("pots")
    .select("*")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getMyPotContributions(potId: string) {
  const supabase = await createSupabaseServerClient();

  if (!potId || potId.includes("[") || potId.includes("%")) {
    throw new Error("Invalid potId");
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: pot, error: potError } = await supabase
    .from("pots")
    .select("id, owner_user_id")
    .eq("id", potId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (potError) {
    throw new Error(potError.message);
  }

  if (!pot) {
    return [];
  }

  const { data, error } = await supabase
    .from("contributions")
    .select("*")
    .eq("pot_id", potId)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getPublicPotByToken(shareToken: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("pots")
    .select("*")
    .eq("share_token", shareToken)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getPotById(potId: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("pots")
    .select("*")
    .eq("id", potId)
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}