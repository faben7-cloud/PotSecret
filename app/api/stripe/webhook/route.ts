import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid webhook signature";
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("WEBHOOK received:", session.id);

    if (session.payment_status !== "paid") {
      console.log("WEBHOOK ignored (not paid):", session.id);
      return new Response("Not paid", { status: 200 });
    }

    const potId = session.metadata?.pot_id ?? null;
    const contributorDisplayName =
      session.metadata?.contributor_display_name ?? "Participant";
    const isAnonymous = session.metadata?.is_anonymous === "true";
    const messageBody = session.metadata?.message_body ?? null;

    if (!potId) {
      return new Response("Missing pot_id in Stripe metadata", { status: 400 });
    }

    const updateResult = await supabase
      .from("contributions")
      .update({
        status: "confirmed",
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        contributor_display_name: contributorDisplayName,
        is_anonymous: isAnonymous,
        message_body: messageBody
      })
      .eq("stripe_checkout_session_id", session.id)
      .eq("status", "pending")
      .select("id");

    console.log("WEBHOOK updateResult:", updateResult);

    if (updateResult.error) {
      return new Response(
        `Supabase update error: ${updateResult.error.message}`,
        { status: 500 }
      );
    }

    if (!updateResult.data || updateResult.data.length === 0) {
      console.log("WEBHOOK fallback insert:", session.id);

      const insertResult = await supabase.from("contributions").insert({
        id: crypto.randomUUID(),
        pot_id: potId,
        contributor_user_id: null,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : null,
        amount: session.amount_total ?? 0,
        currency: (session.currency ?? "eur").toUpperCase(),
        status: "confirmed",
        contributor_display_name: contributorDisplayName,
        is_anonymous: isAnonymous,
        message_body: messageBody,
        created_at: new Date().toISOString()
      });

      if (insertResult.error) {
        return new Response(
          `Supabase insert error: ${insertResult.error.message}`,
          { status: 500 }
        );
      }
    }
  }

  return new Response("ok", { status: 200 });
}