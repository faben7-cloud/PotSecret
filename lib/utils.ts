import { clsx } from "clsx";
import { getCopy } from "@/lib/getCopy";
import type { PotEventType, PotPrivacyMode, PotStatus } from "@/types/database";

const copy = getCopy();
export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatCurrency(amountInMinorUnits: number, currency: string) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amountInMinorUnits / 100);
}

export const privacyModeLabel: Record<PotPrivacyMode, string> = {
  total_only: "Seul le total validé est visible, sans détail individuel.",
  standard: "Les participants ne voient pas les montants individuels, l'organisateur oui.",
  blind_to_owner: "Même l'organisateur ne voit ni montants ni identités détaillées, seulement le total."
};

export const privacyModeOwnerSummary: Record<PotPrivacyMode, string> = {
  total_only: "Mode total_only : seuls le total validé et le volume des contributions restent visibles.",
  standard: "Mode owner_can_see_amounts : l'organisateur peut voir les montants individuels confirmés.",
  blind_to_owner: "Mode strict_secret : seuls le total validé et le volume restent visibles, sans détail individuel."
};

export const eventTypeLabel: Record<PotEventType, string> = copy.potForm.fields.eventType.options;

export const statusLabel: Record<PotStatus, string> = {
  draft: "Brouillon",
  open: "Ouvert",
  closed: "Fermé",
  completed: "Terminé"
};

export function statusBadgeClass(status: PotStatus) {
  switch (status) {
    case "open":
      return "bg-pine/10 text-pine";
    case "closed":
      return "bg-amber-100 text-amber-800";
    case "completed":
      return "bg-ink/10 text-ink";
    case "draft":
    default:
      return "bg-sand text-ink/70";
  }
}

export function formatDate(value: string | null) {
  if (!value) {
    return copy.common.dateUnknown;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long"
  }).format(new Date(value));
}


