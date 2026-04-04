"use client";

import { useFormState } from "react-dom";
import { createPotAction } from "@/app/actions/create-pot-action";

type FormState = {
  error?: string;
};

export function PotForm() {
  const [state, formAction] = useFormState<FormState, FormData>(
    createPotAction,
    {}
  );

  return (
    <form action={formAction} className="space-y-4">
      <input
        name="title"
        placeholder="Titre de la cagnotte"
        className="w-full border rounded p-2"
        required
      />

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Créer la cagnotte
      </button>

      {state?.error && (
        <p className="text-red-500 text-sm">{state.error}</p>
      )}
    </form>
  );
}