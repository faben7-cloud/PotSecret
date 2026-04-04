import Stripe from "stripe";
import { getRequiredEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    const secretKey = getRequiredEnv(
      process.env.STRIPE_SECRET_KEY,
      "STRIPE_SECRET_KEY"
    );

    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}