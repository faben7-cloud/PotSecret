import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const amount = Number(body?.amount ?? 0);
    const currency = String(body?.currency ?? "EUR").toLowerCase();
    const potId = String(body?.potId ?? "");
    const shareToken = String(body?.shareToken ?? "");
    const contributorDisplayName = String(body?.contributorDisplayName ?? "");
    const isAnonymous = Boolean(body?.isAnonymous ?? false);
    const messageBody = String(body?.messageBody ?? "");

    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    if (!potId) {
      return NextResponse.json(
        { error: "Missing potId" },
        { status: 400 }
      );
    }

    if (!shareToken) {
      return NextResponse.json(
        { error: "Missing shareToken" },
        { status: 400 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      submit_type: "donate",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: {
              name: "Participation PotSecret",
              description: "Contribution à une cagnotte PotSecret"
            }
          }
        }
      ],
      success_url: `${siteUrl}/p/${shareToken}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/p/${shareToken}`,
      metadata: {
        pot_id: potId,
        share_token: shareToken,
        contributor_display_name: contributorDisplayName,
        is_anonymous: String(isAnonymous),
        message_body: messageBody
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout session error:", error);

    return NextResponse.json(
      { error: "Unable to create checkout session" },
      { status: 500 }
    );
  }
}