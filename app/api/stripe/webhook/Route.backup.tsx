import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const resend = new Resend(process.env.RESEND_API_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Webhook error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return new Response("Not paid", { status: 200 });
    }

    const potId = session.metadata?.pot_id;
    const contributorName =
      session.metadata?.contributor_display_name || "Participant";
    const messageBody = session.metadata?.message_body || "";
    const amount = session.amount_total || 0;

    // =========================
    // DB UPDATE
    // =========================
    await supabase
      .from("contributions")
      .update({
        status: "confirmed",
        message_body: messageBody
      })
      .eq("stripe_checkout_session_id", session.id);

    // =========================
    // Récupérer pot + owner
    // =========================
    const { data: pot } = await supabase
      .from("pots")
      .select("title, owner_user_id")
      .eq("id", potId)
      .single();

    const { data: owner } = await supabase.auth.admin.getUserById(
      pot.owner_user_id
    );

    const ownerEmail = owner?.user?.email;

    // =========================
    // EMAIL PARTICIPANT
    // =========================
    if (session.customer_details?.email) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: session.customer_details.email,
        subject: "✅ Participation confirmée",
        html: `
          <h2>Merci pour votre participation 🎉</h2>
          <p>Vous avez contribué à : <strong>${pot.title}</strong></p>
          <p>Montant : ${(amount / 100).toFixed(2)} €</p>
          <p>Message : ${messageBody || "—"}</p>
        `
      });
    }

    // =========================
    // EMAIL ORGANISATEUR
    // =========================
    if (ownerEmail) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: ownerEmail,
        subject: "💰 Nouvelle contribution reçue",
        html: `
          <h2>Nouvelle contribution 🎉</h2>
          <p>Pot : <strong>${pot.title}</strong></p>
          <p>Montant : ${(amount / 100).toFixed(2)} €</p>
          <p>Participant : ${contributorName}</p>
          <p>Message : ${messageBody || "—"}</p>
        `
      });
    }
  }

  return new Response("ok", { status: 200 });
}