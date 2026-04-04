"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PotFormState = {
  error?: string;
  fieldErrors?: {
    title?: string;
    description?: string;
    event_date?: string;
    goal_amount?: string;
    beneficiary_name?: string;
    beneficiary_iban?: string;
  };
};

const createPotSchema = z.object({
  title: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères").max(120, "Le titre est trop long"),
  description: z.string().trim().max(1000, "La description est trop longue").optional(),
  event_type: z.enum(["birthday", "farewell", "birth", "wedding", "other"]),
  event_date: z
    .string()
    .optional()
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), "Date invalide"),
  currency: z.enum(["EUR", "USD", "GBP"]),
  goal_amount: z
    .string()
    .optional()
    .refine((value) => !value || /^\d+$/.test(value), "L’objectif doit être un entier")
    .transform((value) => (value ? Number(value) * 100 : null))
    .refine((value) => value === null || value > 0, "L’objectif doit être positif"),
  privacy_mode: z.enum(["total_only", "standard", "blind_to_owner"]),
  beneficiary_name: z.string().trim().max(120, "Nom bénéficiaire trop long").optional(),
  beneficiary_iban: z.string().trim().max(64, "IBAN trop long").optional()
});

function generateShareToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 20);
}

export async function createDashboardPotAction(
  _previousState: PotFormState,
  formData: FormData
): Promise<PotFormState> {
  const parsed = createPotSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    event_type: formData.get("event_type"),
    event_date: formData.get("event_date") || undefined,
    currency: formData.get("currency"),
    goal_amount: formData.get("goal_amount") || undefined,
    privacy_mode: formData.get("privacy_mode"),
    beneficiary_name: formData.get("beneficiary_name") || undefined,
    beneficiary_iban: formData.get("beneficiary_iban") || undefined
  });

  if (!parsed.success) {
    const fieldErrors: PotFormState["fieldErrors"] = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (
        field === "title" ||
        field === "description" ||
        field === "event_date" ||
        field === "goal_amount" ||
        field === "beneficiary_name" ||
        field === "beneficiary_iban"
      ) {
        fieldErrors[field] = issue.message;
      }
    }

    return {
      error: parsed.error.issues[0]?.message ?? "Erreur de validation",
      fieldErrors
    };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Session expirée, reconnecte-toi"
    };
  }

  const payload = {
    owner_user_id: user.id,
    title: parsed.data.title.trim(),
    description: parsed.data.description?.trim() || null,
    event_type: parsed.data.event_type,
    event_date: parsed.data.event_date || null,
    currency: parsed.data.currency,
    goal_amount: parsed.data.goal_amount,
    privacy_mode: parsed.data.privacy_mode,
    beneficiary_name: parsed.data.beneficiary_name?.trim() || null,
    beneficiary_iban: parsed.data.beneficiary_iban?.trim() || null,
    status: "open",
    share_token: generateShareToken()
  };

  const { data, error } = await supabase
    .from("pots")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("createDashboardPotAction error:", error);
    return {
      error: "Erreur création pot"
    };
  }

  redirect(`/dashboard/pots/${data.id}`);
}