"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function createDashboardPotAction(_: any, formData: FormData) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { error: "Non connecté" };

  const payload = {
    owner_user_id: user.id,
    title: formData.get("title"),
    description: formData.get("description"),
    beneficiary_name: formData.get("beneficiary_name"),
    beneficiary_iban: formData.get("beneficiary_iban"),
    currency: "EUR",
    status: "open"
  };

  const { data, error } = await supabase
    .from("pots")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    return { error: "Erreur création pot" };
  }

  redirect(`/dashboard/pots/${data.id}`);
}