"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCopy } from "@/lib/getCopy";
import { logServerError } from "@/lib/logger";
import { sanitizeRequiredTitle, sanitizeUserText } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PotFormState, PotStatus } from "@/types/database";

const copy = getCopy();
const updatePotSchema = z.object({
  pot_id: z.string().uuid(copy.validation.pot.missingPot),
  title: z.string().trim().min(3, copy.validation.pot.titleMin).max(120, copy.validation.pot.titleMax),
  description: z.string().trim().max(1000, copy.validation.pot.descriptionMax).optional(),
  event_type: z.enum(["birthday", "farewell", "birth", "wedding", "other"]),
  event_date: z.string().optional().refine((value) => !value || !Number.isNaN(Date.parse(value)), copy.validation.pot.invalidEventDate),
  currency: z.enum(["EUR", "USD", "GBP"]),
  goal_amount: z
    .string()
    .optional()
    .refine((value) => !value || /^\d+$/.test(value), copy.validation.pot.goalInteger)
    .transform((value) => (value ? Number(value) * 100 : null))
    .refine((value) => value === null || value > 0, copy.validation.pot.goalPositive),
  privacy_mode: z.enum(["total_only", "standard", "blind_to_owner"]),
  messages_visible_to_beneficiary: z.boolean().optional()
});

function revalidatePotRoutes(potId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/pots");
  revalidatePath(`/dashboard/pots/${potId}`);
}

export async function updateDashboardPotAction(
  _previousState: PotFormState,
  formData: FormData
): Promise<PotFormState> {
  const parsed = updatePotSchema.safeParse({
    pot_id: formData.get("pot_id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    event_type: formData.get("event_type"),
    event_date: formData.get("event_date") || undefined,
    currency: formData.get("currency"),
    goal_amount: formData.get("goal_amount") || undefined,
    privacy_mode: formData.get("privacy_mode"),
    messages_visible_to_beneficiary: formData.get("messages_visible_to_beneficiary") === "on"
  });

  if (!parsed.success) {
    const fieldErrors: PotFormState["fieldErrors"] = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (field === "title" || field === "description" || field === "event_date" || field === "goal_amount") {
        fieldErrors[field] = issue.message;
      }
    }

    return {
      error: parsed.error.issues[0]?.message ?? copy.errors.updatePotFailed,
      fieldErrors
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: copy.errors.sessionExpiredContinue
    };
  }

  const { data: currentPot, error: currentPotError } = await supabase.rpc("get_my_pot_detail", {
    p_pot_id: parsed.data.pot_id
  });

  const currentDetail = (currentPot ?? [])[0] as
    | {
        currency: string;
        confirmed_contribution_count: number;
      }
    | undefined;

  if (currentPotError || !currentDetail) {
    logServerError("pots.update", "Failed to load current pot detail before update", currentPotError ?? "missing pot detail", {
      potId: parsed.data.pot_id,
      userId: user.id
    });
    return {
      error: copy.errors.verifyPotStateFailed
    };
  }

  if (currentDetail.currency !== parsed.data.currency && Number(currentDetail.confirmed_contribution_count) > 0) {
    return {
      error: copy.errors.currencyLocked
    };
  }

  const sanitizedTitle = sanitizeRequiredTitle(parsed.data.title);

  if (!sanitizedTitle) {
    return {
      error: copy.errors.sanitizedTitleInvalid,
      fieldErrors: {
        title: copy.errors.sanitizedTitleField
      }
    };
  }

  const { error } = await supabase
    .from("pots")
    .update({
      title: sanitizedTitle,
      description: sanitizeUserText(parsed.data.description, { maxLength: 1000, preserveNewlines: true }),
      event_type: parsed.data.event_type,
      event_date: parsed.data.event_date || null,
      currency: parsed.data.currency,
      goal_amount: parsed.data.goal_amount,
      privacy_mode: parsed.data.privacy_mode,
      messages_visible_to_beneficiary: parsed.data.messages_visible_to_beneficiary ?? false
    })
    .eq("id", parsed.data.pot_id)
    .eq("owner_user_id", user.id);

  if (error) {
    logServerError("pots.update", "Failed to update organizer pot", error, {
      potId: parsed.data.pot_id,
      userId: user.id
    });
    return {
      error: copy.errors.updatePersistenceFailed
    };
  }

  revalidatePotRoutes(parsed.data.pot_id);

  return {
    success: copy.success.potUpdated
  };
}

export async function updateDashboardPotStatusAction(formData: FormData) {
  const parsed = z
    .object({
      pot_id: z.string().uuid(copy.validation.pot.missingPot),
      next_status: z.enum(["closed", "completed"])
    })
    .safeParse({
      pot_id: formData.get("pot_id"),
      next_status: formData.get("next_status")
    });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? copy.errors.invalidAction);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error(copy.errors.sessionExpired);
  }

  const { error } = await supabase
    .from("pots")
    .update({
      status: parsed.data.next_status as PotStatus
    })
    .eq("id", parsed.data.pot_id)
    .eq("owner_user_id", user.id);

  if (error) {
    logServerError("pots.status", "Failed to update pot status", error, {
      potId: parsed.data.pot_id,
      userId: user.id,
      nextStatus: parsed.data.next_status
    });
    throw new Error(copy.errors.updateStatusFailed);
  }

  revalidatePotRoutes(parsed.data.pot_id);
}


