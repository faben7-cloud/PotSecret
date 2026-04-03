"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getCopy } from "@/lib/getCopy";

const copy = getCopy();
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("PotSecret global error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center py-12">
      <div className="w-full rounded-[2rem] border border-white/60 bg-white/95 p-8 shadow-card">
        <p className="text-sm font-medium normal-case tracking-[0.16em] text-coral">{copy.states.error}</p>
        <h1 className="mt-3 text-3xl font-semibold text-ink">{copy.errors.globalTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-ink/70">{copy.errors.globalBody}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink/90"
          >
            {copy.buttons.retry}
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink hover:border-ink/20"
          >
            {copy.buttons.backDashboard}
          </Link>
        </div>
      </div>
    </div>
  );
}




