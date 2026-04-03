import Link from "next/link";
import { CreatePotForm } from "@/components/pot/create-pot-form";
import { requireUser } from "@/lib/auth";
import { getCopy } from "@/lib/getCopy";

const copy = getCopy();
export default async function DashboardNewPotPage() {
  await requireUser("/dashboard/pots/new");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-8">
      <div className="space-y-2">
        <p className="text-sm font-medium normal-case tracking-[0.16em] text-coral">{copy.dashboard.pots.new.eyebrow}</p>
        <h1 className="text-3xl font-semibold text-ink">{copy.dashboard.pots.new.title}</h1>
        <p className="text-sm leading-6 text-ink/70">{copy.dashboard.pots.new.description}</p>
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
        <CreatePotForm />
      </div>

      <div>
        <Link href="/dashboard/pots" className="text-sm font-medium text-coral hover:text-coral/80">
          {copy.dashboard.pots.new.back}
        </Link>
      </div>
    </div>
  );
}



