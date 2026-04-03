import Link from "next/link";
import { PotList } from "@/components/pot/pot-list";
import { KpiCard } from "@/components/ui/kpi-card";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/getCopy";
import { getMyPots } from "@/lib/pots";

const copy = getCopy();
export default async function DashboardPage() {
  const user = await requireUser("/dashboard");
  const pots = await getMyPots();
  const openPots = pots.filter((pot) => pot.status === "open").length;
  const totalContributions = pots.reduce((sum, pot) => sum + pot.confirmed_contribution_count, 0);
  const currencies = new Set(pots.map((pot) => pot.currency)).size;

  return (
    <div className="space-y-8 py-8">
      <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
        <p className="text-sm font-medium normal-case tracking-[0.16em] text-coral">{copy.dashboard.home.eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">
          {copy.dashboard.home.greeting}
          {user.email ? `, ${user.email}` : ""}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">{copy.dashboard.home.description}</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <KpiCard
          label={copy.dashboard.home.kpis.pots.label}
          value={String(pots.length)}
          hint={copy.dashboard.home.kpis.pots.hint}
          tone="soft"
        />
        <KpiCard
          label={copy.dashboard.home.kpis.openPots.label}
          value={String(openPots)}
          hint={copy.dashboard.home.kpis.openPots.hint}
        />
        <KpiCard
          label={copy.dashboard.home.kpis.contributions.label}
          value={String(totalContributions)}
          hint={copy.dashboard.home.kpis.contributions.hint}
        />
        <KpiCard
          label={copy.dashboard.home.kpis.currencies.label}
          value={String(currencies)}
          hint={copy.dashboard.home.kpis.currencies.hint}
        />
        <div className="flex items-stretch">
          <Link
            href="/dashboard/pots/new"
            className="inline-flex w-full items-center justify-center rounded-[1.5rem] bg-ink px-5 py-4 text-sm font-semibold text-white hover:bg-ink/90"
          >
            {copy.buttons.createPot}
          </Link>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-ink">{copy.dashboard.home.listTitle}</h2>
            <p className="text-sm text-ink/70">{copy.dashboard.home.listSubtitle}</p>
          </div>
          <Link href="/dashboard/pots" className="text-sm font-medium text-coral hover:text-coral/80">
            {copy.buttons.dedicatedView}
          </Link>
        </div>
        <PotList pots={pots} />
      </section>
    </div>
  );
}



