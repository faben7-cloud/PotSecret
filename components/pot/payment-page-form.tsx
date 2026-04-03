"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/utils";

const quickAmounts = [10, 20, 30, 50] as const;
const serviceFeeRate = 0.04;

function parseAmount(value: string) {
  const normalized = value.replace(/\s|€/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function toCents(amount: number) {
  return Math.round(amount * 100);
}

function buildSummary(amount: number) {
  const totalCents = toCents(amount);
  const serviceFeeCents = Math.round(totalCents * serviceFeeRate);
  const netCents = totalCents - serviceFeeCents;

  return {
    totalCents,
    serviceFeeCents,
    netCents
  };
}

export function PaymentPageForm({
  currency,
  initialAmount = ""
}: Readonly<{
  currency: string;
  initialAmount?: string;
}>) {
  const [amountValue, setAmountValue] = useState(initialAmount);
  const [firstName, setFirstName] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const parsedAmount = useMemo(() => parseAmount(amountValue), [amountValue]);
  const summary = useMemo(() => (parsedAmount ? buildSummary(parsedAmount) : null), [parsedAmount]);
  const activeQuickAmount = quickAmounts.find((amount) => String(amount) === amountValue) ?? null;

  function handleQuickAmountSelection(amount: number) {
    setAmountValue(String(amount));
  }

  function handleCustomAmountSelection() {
    setAmountValue("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: brancher Stripe Elements / Payment Element et confirmer le paiement côté client.
  }

  const submitLabel = summary ? `Payer ${formatCurrency(summary.totalCents, currency)}` : "Confirmer ma contribution";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">Finalisez votre participation</h2>
          <p className="text-sm leading-6 text-[#6B7280]">
            Quelques informations suffisent pour confirmer votre contribution.
          </p>
        </div>

        <div className="space-y-5 rounded-[2rem] bg-white p-6 shadow-[0_12px_40px_rgba(17,24,39,0.06)] ring-1 ring-black/5 sm:p-7">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-semibold text-[#111827]">
              Montant de votre participation
            </label>
            <input
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              placeholder="Ex. 20 €"
              value={amountValue}
              onChange={(event) => setAmountValue(event.target.value)}
              className="min-h-12 w-full rounded-[1.25rem] border border-black/10 bg-[#fffdf8] px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {quickAmounts.map((amount) => {
              const isActive = activeQuickAmount === amount;

              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickAmountSelection(amount)}
                  className={`inline-flex min-h-12 items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#14B8A6] text-white shadow-sm shadow-[#14B8A6]/20"
                      : "bg-[#fff8ed] text-[#111827] ring-1 ring-black/5 hover:bg-[#fdf3df]"
                  }`}
                >
                  {amount} €
                </button>
              );
            })}

            <button
              type="button"
              onClick={handleCustomAmountSelection}
              className={`inline-flex min-h-12 items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
                amountValue !== "" && activeQuickAmount === null
                  ? "bg-[#14B8A6] text-white shadow-sm shadow-[#14B8A6]/20"
                  : "bg-white text-[#111827] ring-1 ring-black/5 hover:bg-[#f9fafb]"
              }`}
            >
              Autre
            </button>
          </div>

          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-semibold text-[#111827]">
              Votre prénom
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Ex. Marie"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="min-h-12 w-full rounded-[1.25rem] border border-black/10 bg-white px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10"
            />
          </div>

          <label className="flex items-start gap-3 rounded-[1.5rem] bg-[#fff8ed] p-4 ring-1 ring-black/5">
            <input
              className="mt-1 h-4 w-4 rounded border-stone-300"
              type="checkbox"
              checked={isAnonymous}
              onChange={(event) => setIsAnonymous(event.target.checked)}
            />
            <span className="text-sm leading-6 text-[#374151]">Contribuer anonymement</span>
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="message" className="text-sm font-semibold text-[#111827]">
                Ajouter un message
              </label>
              <span className="text-xs font-medium text-[#6B7280]">Optionnel</span>
            </div>
            <textarea
              id="message"
              name="message"
              rows={4}
              placeholder="Un petit mot pour accompagner votre participation"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full rounded-[1.25rem] border border-black/10 bg-white px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[2rem] bg-white p-6 shadow-[0_12px_40px_rgba(17,24,39,0.06)] ring-1 ring-black/5 sm:p-7">
        <div className="space-y-1">
          <h3 className="text-2xl font-semibold tracking-tight text-[#111827]">Paiement</h3>
          <p className="text-sm leading-6 text-[#6B7280]">Paiement sécurisé via Stripe</p>
        </div>

        <div className="rounded-[1.5rem] border border-dashed border-[#14B8A6]/25 bg-[#f8fdfa] p-5">
          <p className="text-sm leading-6 text-[#374151]">
            Zone réservée à Stripe Elements.
          </p>
          <p className="mt-2 text-xs leading-5 text-[#6B7280]">
            Brancher ici CardElement ou Payment Element lors de l’intégration finale Stripe.
          </p>
        </div>
      </section>

      <section className="space-y-5 rounded-[2rem] bg-[#fff8ed] p-6 shadow-[0_12px_40px_rgba(17,24,39,0.06)] ring-1 ring-black/5 sm:p-7">
        <h3 className="text-2xl font-semibold tracking-tight text-[#111827]">Récapitulatif</h3>

        <div className="space-y-3 text-sm text-[#374151]">
          <div className="flex items-center justify-between gap-4">
            <span>Vous payez :</span>
            <span className="font-semibold text-[#111827]">
              {summary ? formatCurrency(summary.totalCents, currency) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Frais de service inclus :</span>
            <span className="font-semibold text-[#111827]">
              {summary ? formatCurrency(summary.serviceFeeCents, currency) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span>Montant reversé au pot :</span>
            <span className="font-semibold text-[#111827]">
              {summary ? formatCurrency(summary.netCents, currency) : "—"}
            </span>
          </div>
        </div>

        <p className="text-xs leading-5 text-[#6B7280]">
          Les frais de service permettent de sécuriser les paiements et de faire fonctionner PotSecret.
        </p>

        <button
          type="submit"
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#14B8A6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#14B8A6]/20 transition hover:bg-[#0f9f90]"
        >
          {submitLabel}
        </button>

        <p className="text-center text-sm leading-6 text-[#6B7280]">
          Votre contribution est rapide, sécurisée et discrète.
        </p>
      </section>
    </form>
  );
}
