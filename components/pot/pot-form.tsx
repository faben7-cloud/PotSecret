"use client";

import { useFormState, useFormStatus } from "react-dom";

type PotFormState = {
  error?: string;
  fieldErrors?: {
    title?: string;
    description?: string;
    event_date?: string;
    goal_amount?: string;
    beneficiary_name?: string;
    beneficiary_iban?: string;
  };
};

type PotFormAction = (
  state: PotFormState,
  formData: FormData
) => Promise<PotFormState | void>;

type PotFormProps = {
  action: PotFormAction;
  submitLabel: string;
  pendingLabel: string;
};

function SubmitButton({
  submitLabel,
  pendingLabel
}: {
  submitLabel: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink/90 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? pendingLabel : submitLabel}
    </button>
  );
}

export function PotForm({
  action,
  submitLabel,
  pendingLabel
}: PotFormProps) {
  const typedAction = action as unknown as (
    state: PotFormState,
    payload: FormData
  ) => PotFormState | Promise<PotFormState>;

  const [state, formAction] = useFormState<PotFormState, FormData>(
    typedAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-ink">Titre</label>
        <input
          name="title"
          className="mt-1 w-full rounded-lg border p-2"
          placeholder="Ex : Anniversaire Julien"
          required
        />
        {state?.fieldErrors?.title && (
          <p className="mt-1 text-sm text-red-500">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Description</label>
        <textarea
          name="description"
          className="mt-1 w-full rounded-lg border p-2"
          placeholder="Décris la surprise en quelques mots"
          rows={4}
        />
        {state?.fieldErrors?.description && (
          <p className="mt-1 text-sm text-red-500">{state.fieldErrors.description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">Type d’événement</label>
          <select
            name="event_type"
            className="mt-1 w-full rounded-lg border p-2"
            defaultValue="birthday"
          >
            <option value="birthday">Anniversaire</option>
            <option value="farewell">Départ</option>
            <option value="birth">Naissance</option>
            <option value="wedding">Mariage</option>
            <option value="other">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Date de l’événement</label>
          <input
            name="event_date"
            type="date"
            className="mt-1 w-full rounded-lg border p-2"
          />
          {state?.fieldErrors?.event_date && (
            <p className="mt-1 text-sm text-red-500">{state.fieldErrors.event_date}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-ink">Devise</label>
          <select
            name="currency"
            className="mt-1 w-full rounded-lg border p-2"
            defaultValue="EUR"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Objectif (optionnel)</label>
          <input
            name="goal_amount"
            type="number"
            min="1"
            step="1"
            className="mt-1 w-full rounded-lg border p-2"
            placeholder="100"
          />
          {state?.fieldErrors?.goal_amount && (
            <p className="mt-1 text-sm text-red-500">{state.fieldErrors.goal_amount}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Confidentialité</label>
          <select
            name="privacy_mode"
            className="mt-1 w-full rounded-lg border p-2"
            defaultValue="total_only"
          >
            <option value="total_only">Montants masqués</option>
            <option value="standard">Standard</option>
            <option value="blind_to_owner">Masqué même à l’organisateur</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold text-ink">Bénéficiaire</h3>

        <div>
          <label className="block text-sm font-medium text-ink">Nom du bénéficiaire</label>
          <input
            name="beneficiary_name"
            className="mt-1 w-full rounded-lg border p-2"
            placeholder="Ex : Julien"
          />
          {state?.fieldErrors?.beneficiary_name && (
            <p className="mt-1 text-sm text-red-500">{state.fieldErrors.beneficiary_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">IBAN (optionnel)</label>
          <input
            name="beneficiary_iban"
            className="mt-1 w-full rounded-lg border p-2"
            placeholder="FR76..."
          />
          {state?.fieldErrors?.beneficiary_iban && (
            <p className="mt-1 text-sm text-red-500">{state.fieldErrors.beneficiary_iban}</p>
          )}
        </div>
      </div>

      <SubmitButton
        submitLabel={submitLabel}
        pendingLabel={pendingLabel}
      />

      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
    </form>
  );
}