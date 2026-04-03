"use client";

import { createDashboardPotAction } from "@/app/dashboard/pots/new/actions";
import { PotForm } from "@/components/pot/pot-form";
import { getCopy } from "@/lib/getCopy";

const copy = getCopy();
export function CreatePotForm() {
  return <PotForm action={createDashboardPotAction} submitLabel={copy.potForm.submit} pendingLabel={copy.potForm.pending} />;
}


