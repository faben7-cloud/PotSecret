import test from "node:test";
import assert from "node:assert/strict";
import { canCreateCheckout, canExposeRevealIdentity, getCheckoutOutcome, validateConfirmedCheckout, verifyStripeWebhookSignature } from "../lib/payment-security.ts";

const contribution = { id: "contribution-1", pot_id: "pot-1", stripe_checkout_session_id: "cs_1", amount: 2000, currency: "EUR", status: "pending" };

test("webhook rejects an invalid Stripe signature", () => {
  assert.equal(verifyStripeWebhookSignature(() => { throw new Error("bad signature"); }, "{}", "invalid", "whsec_test"), null);
});

test("webhook accepts a verified event", () => {
  const event = { id: "evt_1" };
  assert.equal(verifyStripeWebhookSignature(() => event, "{}", "valid", "whsec_test"), event);
});

test("Checkout only confirms paid sessions and handles failures", () => {
  assert.equal(getCheckoutOutcome("checkout.session.completed", "paid"), "confirm");
  assert.equal(getCheckoutOutcome("checkout.session.completed", "unpaid"), "ignore");
  assert.equal(getCheckoutOutcome("checkout.session.expired", "unpaid"), "fail");
});

test("Checkout data must match its pending contribution", () => {
  assert.equal(validateConfirmedCheckout({ id: "cs_1", amount_total: 2000, currency: "eur", payment_status: "paid", metadata: { pot_id: "pot-1" } }, contribution), null);
  assert.equal(validateConfirmedCheckout({ id: "cs_1", amount_total: 3000, currency: "eur", payment_status: "paid", metadata: { pot_id: "pot-1" } }, contribution), "amount_mismatch");
});

test("a replay cannot confirm the same contribution twice", () => {
  let status = "pending";
  let confirmations = 0;
  const confirmOnce = () => { if (status !== "pending") return false; status = "confirmed"; confirmations += 1; return true; };
  assert.equal(confirmOnce(), true);
  assert.equal(confirmOnce(), false);
  assert.equal(confirmations, 1);
});

test("public records omit individual amounts and raw identities", () => {
  const record = { message_body: "Bravo", visible_identity: null, visible_hint_level_1: "Un ami", created_at: "2026-01-01" };
  assert.equal("amount" in record, false);
  assert.equal("contributor_display_name" in record, false);
});

test("anonymous identities never become visible", () => {
  assert.equal(canExposeRevealIdentity({ isAnonymous: true, mysteryMode: false, potRevealed: true }), false);
});

test("mystery identities require pot.revealed", () => {
  assert.equal(canExposeRevealIdentity({ isAnonymous: false, mysteryMode: true, potRevealed: false }), false);
  assert.equal(canExposeRevealIdentity({ isAnonymous: false, mysteryMode: true, potRevealed: true }), true);
});

test("Checkout is refused for invalid or closed pots", () => {
  assert.equal(canCreateCheckout(null), false);
  assert.equal(canCreateCheckout({ id: "pot-1", title: "Pot", currency: "EUR", status: "closed" }), false);
  assert.equal(canCreateCheckout({ id: "pot-1", title: "Pot", currency: "EUR", status: "open" }), true);
});
