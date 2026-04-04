"use client";

import { useFormState, useFormStatus } from "react-dom";

type PotFormState = {
  error?: string;
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
      className="bg-black text-white px-4 py-2 rounded-full"
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
        <label className="block text-sm font-medium">Titre</label>
        <input
          name="title"
          className="w-full mt-1 border rounded-lg p-2"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          className="w-full mt-1 border rounded-lg p-2"
        />
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-lg">Bénéficiaire</h3>

        <div>
          <label className="block text-sm">Nom du bénéficiaire</label>
          <input
            name="beneficiary_name"
            className="w-full mt-1 border rounded-lg p-2"
            placeholder="Ex : Julien"
          />
        </div>

        <div>
          <label className="block text-sm">IBAN (optionnel)</label>
          <input
            name="beneficiary_iban"
            className="w-full mt-1 border rounded-lg p-2"
            placeholder="FR76..."
          />
        </div>
      </div>

      <SubmitButton
        submitLabel={submitLabel}
        pendingLabel={pendingLabel}
      />

      {state?.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
    </form>
  );
}