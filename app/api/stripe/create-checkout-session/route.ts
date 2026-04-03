import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { potId, amount, contributorName, isAnonymous } = await req.json();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "Contribution PotSecret",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    metadata: {
      pot_id: potId,
      contributor_name: contributorName || "Participant",
      is_anonymous: String(Boolean(isAnonymous)),
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/`,
  });

  return NextResponse.json({ url: session.url });
}