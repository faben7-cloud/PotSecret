"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/env";
import { getCopy } from "@/lib/getCopy";
import { logServerError, logServerWarn } from "@/lib/logger";
import { getPublicPotByToken } from "@/lib/pots";
import { sanitizeUserText } from "@/lib/security";
import { getStripe } from "@/lib/stripe";
import type { ContributionFormState } from "@/types/database";

const copy = getCopy();

const contributionSchema = z.object({
  share_token: z.string().trim().min(12, copy.errors.invalidShareLink),
  amount: z
    .string()
    .trim()
    .refine((value) => /^\d+(?:[.,]\d{1,2})?$/.test(value), copy.errors.invalidAmount)
    .transform((value) => Number.parseFloat(value.replace(",", ".")))
    .refine((value) => Number.isFinite(value) && value >= 1, copy.errors.minimumAmount)
    .refine((value) => value <= 10000, copy.errors.maximumAmount)
    .transform((value) => Math.round(value * 100)),
  display_name: z.string().trim().max(80, copy.errors.displayNameTooLong).optional(),
  message: z.string().trim().max(500, copy.errors.messageTooLong).optional(),
  is_anonymous: z.boolean().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: copy.errors.consentRequired })
  })
});

export async function prepareContributionAction(
  _previousState: ContributionFormState,
  formData: FormData
): Promise<ContributionFormState> {
  const parsed = contributionSchema.safeParse({
    share_token: formData.get("share_token"),
    amount: formData.get("amount"),
    display_name: formData.get("display_name") || undefined,
    message: formData.get("message") || undefined,
    is_anonymous: formData.get("is_anonymous") === "on",
    consent: formData.get("consent") === "on"
  });

  if (!parsed.success) {
    const fieldErrors: ContributionFormState["fieldErrors"] = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (field === "amount" || field === "display_name" || field === "message" || field === "consent") {
        fieldErrors[field] = issue.message;
      }
    }

    return {
      error: parsed.error.issues[0]?.message ?? copy.errors.invalidContribution,
      fieldErrors
    };
  }

  const pot = await getPublicPotByToken(parsed.data.share_token);

  if (!pot || pot.status !== "open") {
    logServerWarn("contribution.prepare", "Contribution attempted on unavailable pot", {
      shareToken: parsed.data.share_token,
      potFound: Boolean(pot),
      potStatus: pot?.status
    });

    return {
      error: copy.errors.potUnavailable
    };
  }

  const stripe = getStripe();
  const contributorDisplayName = sanitizeUserText(parsed.data.display_name, { maxLength: 80 });
  const isAnonymous = parsed.data.is_anonymous ?? false;
  const messageBody = sanitizeUserText(parsed.data.message, { maxLength: 500, preserveNewlines: true });

  let session;

  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: pot.currency.toLowerCase(),
            unit_amount: parsed.data.amount,
            product_data: {
              name: `Contribution PotSecret - ${pot.title}`,
              description: "Participation à une cagnotte surprise PotSecret"
            }
          }
        }
      ],
      success_url: `${getBaseUrl()}/p/${parsed.data.share_token}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getBaseUrl()}/p/${parsed.data.share_token}/cancel`,
      metadata: {
        pot_id: pot.id,
        share_token: parsed.data.share_token,
        contributor_display_name: contributorDisplayName ?? "",
        is_anonymous: String(isAnonymous),
        message_body: messageBody ?? ""
      },
      payment_intent_data: {
        metadata: {
          pot_id: pot.id,
          share_token: parsed.data.share_token,
          contributor_display_name: contributorDisplayName ?? "",
          is_anonymous: String(isAnonymous),
          message_body: messageBody ?? ""
        }
      }
    });
  } catch (error) {
    logServerError("contribution.prepare", "Failed to create Stripe Checkout session", error, {
      potId: pot.id,
      shareToken: parsed.data.share_token
    });

    return {
      error: copy.errors.stripeSessionFailed
    };
  }

  const admin = createSupabaseAdminClient();

console.log("ACTIONS session.id:", session.id);
console.log("ACTIONS pot.id:", pot.id);
console.log("ACTIONS amount:", parsed.data.amount);
console.log("ACTIONS currency:", pot.currency);

const insertPayload = {
  pot_id: pot.id,
  stripe_checkout_session_id: session.id,
  stripe_payment_intent_id:
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : null,
  amount: parsed.data.amount,
  currency: pot.currency,
  status: "pending",
  contributor_display_name: contributorDisplayName,
  is_anonymous: isAnonymous,
  message_body: messageBody
};

console.log("ACTIONS insertPayload:", insertPayload);
const { data: insertedContribution, error: insertError } = await admin
  .from("contributions")
  .insert(insertPayload)
  .select();
  
console.log("ACTIONS insertedContribution:", insertedContribution);
console.log("ACTIONS insertError:", insertError);
  if (insertError) {
    logServerError("contribution.prepare", "Failed to persist pending contribution", insertError, {
      potId: pot.id,
      sessionId: session.id
    });

    try {
      await stripe.checkout.sessions.expire(session.id);
    } catch (expireError) {
      logServerError("contribution.prepare", "Failed to expire Stripe session after persistence error", expireError, {
        sessionId: session.id
      });
    }

    return {
      error: copy.errors.contributionPrepareFailed
    };
  }

  if (!session.url) {
    logServerWarn("contribution.prepare", "Stripe session returned without URL", {
      potId: pot.id,
      sessionId: session.id
    });

    return {
      error: copy.errors.stripeUrlMissing
    };
  }

  redirect(session.url);
}