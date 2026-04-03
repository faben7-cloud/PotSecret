import Link from "next/link";
import { PotList } from "@/components/pot/pot-list";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/getCopy";
import { getMyPots } from "@/lib/pots";

const copy = getCopy();
export default async function DashboardPotsPage() {
  await requireUser("/dashboard/pots");
  const pots = await getMyPots();

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium normal-case tracking-[0.16em] text-coral">{copy.dashboard.pots.eyebrow}</p>
          <h1 className="text-3xl font-semibold text-ink">{copy.dashboard.pots.title}</h1>
          <p className="text-sm text-ink/70">{copy.dashboard.pots.description}</p>
        </div>
        <Link
          href="/dashboard/pots/new"
          className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink/90"
        >
          {copy.buttons.createPot}
        </Link>
      </div>

      <PotList pots={pots} />
    </div>
  );
}



