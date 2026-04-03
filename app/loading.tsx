import { getCopy } from "@/lib/getCopy";

const copy = getCopy();
export default function GlobalLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-12">
      <div className="rounded-[2rem] border border-white/60 bg-white/95 px-6 py-5 text-sm text-ink/70 shadow-card">
        {copy.states.loading}
      </div>
    </div>
  );
}


