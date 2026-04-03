import { getCopy } from "@/lib/getCopy";

const copy = getCopy();

export function SiteFooter() {
  return (
    <footer className="border-t border-white/60 bg-white/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-[#4B5563] sm:px-6 lg:px-8">
        <p className="text-base font-semibold text-[#111827]">{copy.common.siteName}</p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span>{copy.footer.legal}</span>
          <span>{copy.footer.contact}</span>
          <span>{copy.footer.terms}</span>
        </div>
      </div>
    </footer>
  );
}
