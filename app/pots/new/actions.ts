"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CreatePotFormState } from "@/types/database";

const createPotSchema = z.object({
  title: z.string().trim().min(3, "Le titre est trop court.").max(120, "Le titre est trop long."),
  description: z.string().trim().max(1000, "La description est trop longue.").optional(),
  event_type: z.enum(["birthday", "farewell", "birth", "wedding", "other"]),
  event_date: z.string().optional(),
  currency: z.enum(["EUR", "USD", "GBP"]),
  target_amount: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : null))
    .refine((value) => value === null || (Number.isInteger(value) && value > 0), "Objectif invalide."),
  privacy_mode: z.enum(["standard", "blind_to_organizer"]),
  show_messages_to_beneficiary: z.boolean().optional()
});

export async function createPotAction(
  _previousState: CreatePotFormState,
  formData: FormData
): Promise<CreatePotFormState> {
  const parsed = createPotSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    event_type: formData.get("event_type"),
    event_date: formData.get("event_date") || undefined,
    currency: formData.get("currency"),
    target_amount: formData.get("target_amount") || undefined,
    privacy_mode: formData.get("privacy_mode"),
    show_messages_to_beneficiary: formData.get("show_messages_to_beneficiary") === "on"
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Impossible de creer ce pot."
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Votre session a expire. Reconnectez-vous."
    };
  }

  const { error } = await supabase.from("pots").insert({
    organizer_id: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    event_type: parsed.data.event_type,
    event_date: parsed.data.event_date || null,
    currency: parsed.data.currency,
    target_amount: parsed.data.target_amount,
    privacy_mode: parsed.data.privacy_mode,
    show_messages_to_beneficiary: parsed.data.show_messages_to_beneficiary ?? true,
    status: "open"
  });

  if (error) {
    return {
      error: error.message
    };
  }

  redirect("/pots");
}

