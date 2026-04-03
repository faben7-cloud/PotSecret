"use client";

import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { prepareContributionAction } from "@/app/p/[shareToken]/actions";
import { formatCurrency } from "@/lib/utils";
import type { ContributionFormState } from "@/types/database";

const initialState: ContributionFormState = {};
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

function buildContributionSummary(amount: number) {
  const totalCents = toCents(amount);
  const serviceFeeCents = Math.round(totalCents * serviceFeeRate);
  const netCents = totalCents - serviceFeeCents;

  return {
    totalCents,
    serviceFeeCents,
    netCents
  };
}

function SubmitButton({
  disabled,
  currency,
  amountValue
}: {
  disabled?: boolean;
  currency: string;
  amountValue: string;
}) {
  const { pending } = useFormStatus();
  const parsedAmount = parseAmount(amountValue);
  const label =
    parsedAmount && parsedAmount > 0
      ? `Payer ${formatCurrency(buildContributionSummary(parsedAmount).totalCents, currency)}`
      : "Confirmer ma contribution";

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#14B8A6] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#14B8A6]/20 transition hover:bg-[#0f9f90] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Redirection..." : label}
    </button>
  );
}

export function ContributionForm({
  shareToken,
  currency,
  disabled
}: {
  shareToken: string;
  currency: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useFormState(prepareContributionAction, initialState);
  const [amountValue, setAmountValue] = useState("");
  const amountInputRef = useRef<HTMLInputElement>(null);

  const parsedAmount = parseAmount(amountValue);
  const summary = parsedAmount ? buildContributionSummary(parsedAmount) : null;

  function handleQuickAmountSelection(amount: number) {
    setAmountValue(String(amount));
    amountInputRef.current?.focus();
  }

  function handleCustomAmountSelection() {
    setAmountValue("");
    amountInputRef.current?.focus();
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">Choisissez un montant</h2>
          <p className="text-sm leading-6 text-[#6B7280]">
            Quelques euros suffisent pour faire plaisir à plusieurs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {quickAmounts.map((amount) => {
            const isActive = amountValue === String(amount);

            return (
              <button
                key={amount}
                type="button"
                disabled={disabled}
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
            disabled={disabled}
            onClick={handleCustomAmountSelection}
            className={`inline-flex min-h-12 items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
              amountValue !== "" && !quickAmounts.map(String).includes(amountValue)
                ? "bg-[#14B8A6] text-white shadow-sm shadow-[#14B8A6]/20"
                : "bg-white text-[#111827] ring-1 ring-black/5 hover:bg-[#f9fafb]"
            }`}
          >
            Autre
          </button>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="share_token" value={shareToken} />
        <input type="hidden" name="consent" value="on" />

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">Prêt à participer ?</h2>
          <p className="text-sm leading-6 text-[#6B7280]">Contribuez en quelques secondes à cette surprise.</p>
        </div>

        <div className="grid gap-5">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-semibold text-[#111827]">
              Montant de votre participation
            </label>
            <input
              ref={amountInputRef}
              id="amount"
              name="amount"
              type="text"
              inputMode="decimal"
              placeholder="Ex. 20 €"
              required
              disabled={disabled}
              value={amountValue}
              onChange={(event) => setAmountValue(event.target.value)}
              className="min-h-12 w-full rounded-[1.25rem] border border-black/10 bg-[#fffdf8] px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10"
            />
            {state.fieldErrors?.amount ? <p className="text-sm text-red-600">{state.fieldErrors.amount}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="display_name" className="text-sm font-semibold text-[#111827]">
              Votre prénom
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              placeholder="Ex. Marie"
              disabled={disabled}
              className="min-h-12 w-full rounded-[1.25rem] border border-black/10 bg-white px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10"
            />
            {state.fieldErrors?.display_name ? (
              <p className="text-sm text-red-600">{state.fieldErrors.display_name}</p>
            ) : null}
          </div>

          <label className="flex items-start gap-3 rounded-[1.5rem] bg-[#fff8ed] p-4 ring-1 ring-black/5">
            <input
              className="mt-1 h-4 w-4 rounded border-stone-300"
              type="checkbox"
              name="is_anonymous"
              disabled={disabled}
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
              disabled={disabled}
              className="w-full rounded-[1.25rem] border border-black/10 bg-white px-4 py-3 text-base text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10"
            />
            {state.fieldErrors?.message ? <p className="text-sm text-red-600">{state.fieldErrors.message}</p> : null}
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-[#fff8ed] p-5 ring-1 ring-black/5">
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
          <p className="mt-4 text-xs leading-5 text-[#6B7280]">
            Les frais de service permettent de sécuriser les paiements et de faire fonctionner PotSecret.
          </p>
        </div>

        {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

        <SubmitButton disabled={disabled} currency={currency} amountValue={amountValue} />
      </form>
    </div>
  );
}
