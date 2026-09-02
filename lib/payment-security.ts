export type CheckoutPot = {
  id: string;
  title: string;
  currency: string;
  status: string;
};

export type StoredContributionForWebhook = {
  id: string;
  pot_id: string;
  stripe_checkout_session_id: string;
  amount: number;
  currency: string;
  status: string;
};

export type CheckoutSessionForWebhook = {
  id: string;
  amount_total: number | null;
  currency: string | null;
  payment_status: string;
  metadata: Record<string, string> | null;
};

export type CheckoutOutcome = "confirm" | "fail" | "ignore";

export function verifyStripeWebhookSignature<T>(
  constructEvent: (payload: string, signature: string, secret: string) => T,
  payload: string,
  signature: string | null,
  secret: string
): T | null {
  if (!signature) return null;

  try {
    return constructEvent(payload, signature, secret);
  } catch {
    return null;
  }
}

export function canCreateCheckout(pot: CheckoutPot | null): pot is CheckoutPot {
  return Boolean(pot && pot.status === "open" && /^[A-Z]{3}$/.test(pot.currency));
}

export function getCheckoutOutcome(eventType: string, paymentStatus: string): CheckoutOutcome {
  if (
    (eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded") &&
    paymentStatus === "paid"
  ) {
    return "confirm";
  }

  if (eventType === "checkout.session.async_payment_failed" || eventType === "checkout.session.expired") {
    return "fail";
  }

  return "ignore";
}

export function validateConfirmedCheckout(
  session: CheckoutSessionForWebhook,
  contribution: StoredContributionForWebhook
): string | null {
  if (session.id !== contribution.stripe_checkout_session_id) {
    return "checkout_session_mismatch";
  }

  if (!Number.isSafeInteger(session.amount_total) || session.amount_total! <= 0 || session.amount_total !== contribution.amount) {
    return "amount_mismatch";
  }

  if (session.currency?.toUpperCase() !== contribution.currency) {
    return "currency_mismatch";
  }

  if (session.metadata?.pot_id !== contribution.pot_id) {
    return "pot_mismatch";
  }

  return null;
}

export function canExposeRevealIdentity({
  isAnonymous,
  mysteryMode,
  potRevealed
}: {
  isAnonymous: boolean;
  mysteryMode: boolean;
  potRevealed: boolean;
}) {
  return !isAnonymous && (!mysteryMode || potRevealed);
}
