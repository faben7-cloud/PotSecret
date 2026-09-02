export const BENEFICIARY_PAYOUT_COMMISSION_RATE = 0.04;

export function toCents(amount: number) {
  if (!Number.isFinite(amount)) {
    throw new Error("Invalid amount");
  }

  return Math.round(amount * 100);
}

export function calculateBeneficiaryPayoutBreakdown(totalAmountCents: number) {
  if (!Number.isInteger(totalAmountCents) || totalAmountCents < 0) {
    throw new Error("Invalid payout amount");
  }

  const commissionAmountCents = Math.round(totalAmountCents * BENEFICIARY_PAYOUT_COMMISSION_RATE);
  const netAmountCents = totalAmountCents - commissionAmountCents;

  return {
    totalAmountCents,
    commissionAmountCents,
    netAmountCents
  };
}
