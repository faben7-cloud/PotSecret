import { cn, statusBadgeClass, statusLabel } from "@/lib/utils";
import type { PotStatus } from "@/types/database";

export function StatusBadge({ status }: { status: PotStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-semibold normal-case tracking-[0.16em]",
        statusBadgeClass(status)
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

