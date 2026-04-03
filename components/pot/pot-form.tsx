"use client";

import { useFormState, useFormStatus } from "react-dom";

export function PotForm({
  action,
  submitLabel,
  pendingLabel
}: {
  action: any;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction] = useFormState(action, {});
  const { pending } = useFormStatus();

  return (
    <form action={formAction} className="space-y-6">

      {/* TITRE */}
      <div>
        <label className="block text-sm font-medium">Titre</label>
        <input
          name="title"
          className="w-full mt-1 border rounded-lg p-2"
          required
        />
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          className="w-full mt-1 border rounded-lg p-2"
        />
      </div>

      {/* BÉNÉFICIAIRE */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-lg">Bénéficiaire</h3>

        <div>
          <label className="block text-sm">Nom du bénéficiaire</label>
          <input
            name="beneficiary_name"
            className="w-full mt-1 border rounded-lg p-2"
            placeholder="Ex : Julien"
            required
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

      {/* SUBMIT */}
      <button
        type="submit"
        className="bg-black text-white px-4 py-2 rounded-full"
      >
        {pending ? pendingLabel : submitLabel}
      </button>

      {state?.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
    </form>
  );
}