"use client";

import { useState } from "react";
import { getCopy } from "@/lib/getCopy";

const copy = getCopy();
export function CopyShareLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink/20"
    >
      {copied ? copy.buttons.copied : copy.buttons.copy}
    </button>
  );
}


