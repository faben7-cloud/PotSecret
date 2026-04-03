import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCopy } from "@/lib/getCopy";
import { eventTypeLabel, formatCurrency, formatDate, privacyModeOwnerSummary } from "@/lib/utils";
import type { PotSummary } from "@/types/database";

const copy = getCopy();
export function PotList({
  pots,
  emptyTitle = copy.potList.emptyTitle,
  emptyDescription = copy.potList.emptyDescription
}: {
  pots: PotSummary[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (pots.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-ink/15 bg-white/85 p-8 text-center shadow-card">
        <p className="text-lg font-medium text-ink">{emptyTitle}</p>
        <p className="mt-2 text-sm text-ink/70">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {pots.map((pot) => (
        <article key={pot.id} className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold normal-case tracking-[0.16em] text-ink/70">
                  {eventTypeLabel[pot.event_type]}
                </span>
                <StatusBadge status={pot.status} />
                <span className="text-xs text-ink/45">{`${copy.potList.createdOn} ${formatDate(pot.created_at)}`}</span>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-ink">{pot.title}</h2>
                <p className="mt-1 text-sm leading-6 text-ink/70">{privacyModeOwnerSummary[pot.privacy_mode]}</p>
              </div>
              <p className="text-sm text-ink/65">{`${copy.potList.publicLink}: /p/${pot.share_token}`}</p>
            </div>

            <div className="rounded-[1.5rem] bg-mist px-5 py-4 text-right">
              <p className="text-xs normal-case tracking-[0.16em] text-ink/50">{copy.potList.validTotal}</p>
              <p className="mt-1 text-2xl font-semibold text-ink">
                {formatCurrency(pot.confirmed_total_amount, pot.currency)}
              </p>
              <p className="mt-1 text-sm text-ink/60">
                {`${pot.confirmed_contribution_count} ${copy.potList.confirmedContributions}`}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <Link
              href={`/dashboard/pots/${pot.id}`}
              className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink/20"
            >
              {copy.buttons.seeDetails}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}



