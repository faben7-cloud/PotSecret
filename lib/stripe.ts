import Stripe from "stripe";
import { getRequiredEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (!stripeClient) {
    stripeClient = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
  }

  return stripeClient;
}

