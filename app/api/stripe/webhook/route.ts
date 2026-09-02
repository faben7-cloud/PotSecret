import Stripe from "stripe";
import { getStripeWebhookSecret } from "@/lib/env";
import { logServerError, logServerWarn } from "@/lib/logger";
import { getCheckoutOutcome, validateConfirmedCheckout, verifyStripeWebhookSignature, type StoredContributionForWebhook } from "@/lib/payment-security";
import { sanitizeUserText } from "@/lib/security";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ContributionRow = StoredContributionForWebhook & { stripe_payment_intent_id: string | null; contributor_display_name: string | null; is_anonymous: boolean };
function paymentIntentId(value: Stripe.Checkout.Session["payment_intent"]) { return typeof value === "string" ? value : value?.id ?? null; }

async function loadContribution(sessionId: string) {
  const { data, error } = await createSupabaseAdminClient().from("contributions")
    .select("id, pot_id, stripe_checkout_session_id, stripe_payment_intent_id, amount, currency, status, contributor_display_name, is_anonymous")
    .eq("stripe_checkout_session_id", sessionId).maybeSingle();
  if (error) throw new Error("contribution_lookup_failed");
  return data as ContributionRow | null;
}

async function persistMessage(session: Stripe.Checkout.Session, contribution: ContributionRow) {
  const body = sanitizeUserText(session.metadata?.message_body, { maxLength: 500, preserveNewlines: true });
  if (!body) return;
  const { error } = await createSupabaseAdminClient().from("messages").upsert({
    pot_id: contribution.pot_id, contribution_id: contribution.id, body,
    author_display_name: contribution.contributor_display_name, is_anonymous: contribution.is_anonymous
  }, { onConflict: "contribution_id", ignoreDuplicates: true });
  if (error) throw new Error("message_persistence_failed");
}

async function confirmSession(session: Stripe.Checkout.Session) {
  const contribution = await loadContribution(session.id);
  if (!contribution) return { ok: false, status: 400, reason: "unknown_checkout_session" };
  const mismatch = validateConfirmedCheckout(session, contribution);
  if (mismatch) return { ok: false, status: 400, reason: mismatch };
  if (contribution.status === "pending") {
    const { data, error } = await createSupabaseAdminClient().from("contributions")
      .update({ status: "confirmed", stripe_payment_intent_id: paymentIntentId(session.payment_intent) })
      .eq("id", contribution.id).eq("status", "pending")
      .select("id, pot_id, stripe_checkout_session_id, stripe_payment_intent_id, amount, currency, status, contributor_display_name, is_anonymous").maybeSingle();
    if (error) throw new Error("contribution_confirmation_failed");
    if (data) { await persistMessage(session, data as ContributionRow); return { ok: true, status: 200 }; }
  }
  const current = await loadContribution(session.id);
  if (!current || current.status !== "confirmed") return { ok: false, status: 409, reason: "contribution_not_confirmable" };
  await persistMessage(session, current);
  return { ok: true, status: 200 };
}

async function failSession(session: Stripe.Checkout.Session) {
  const { error } = await createSupabaseAdminClient().from("contributions")
    .update({ status: "failed" }).eq("stripe_checkout_session_id", session.id).eq("status", "pending");
  if (error) throw new Error("contribution_failure_update_failed");
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });
  let event: Stripe.Event;
  try { event = getStripe().webhooks.constructEvent(await request.text(), signature, getStripeWebhookSecret()); }
  catch { logServerWarn("stripe.webhook", "Rejected Stripe webhook with invalid signature"); return new Response("Invalid Stripe signature", { status: 400 }); }
  if (!event.type.startsWith("checkout.session.")) return new Response(null, { status: 200 });
  const session = event.data.object as Stripe.Checkout.Session;
  try {
    const outcome = getCheckoutOutcome(event.type, session.payment_status);
    if (outcome === "confirm") {
      const result = await confirmSession(session);
      if (!result.ok) {
        logServerWarn("stripe.webhook", "Rejected verified Checkout event", { eventType: event.type, sessionId: session.id, reason: result.reason });
        return new Response("Checkout event rejected", { status: result.status });
      }
    } else if (outcome === "fail") await failSession(session);
  } catch (error) {
    logServerError("stripe.webhook", "Failed to process verified Checkout event", error, { eventType: event.type, sessionId: session.id });
    return new Response("Webhook processing failed", { status: 500 });
  }
  return new Response(null, { status: 200 });
}
