import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "default"
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "soft";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] p-5",
        tone === "soft" ? "bg-mist" : "bg-white ring-1 ring-ink/8"
      )}
    >
      <p className="text-xs normal-case tracking-[0.16em] text-ink/50">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-ink/65">{hint}</p>
    </div>
  );
}

