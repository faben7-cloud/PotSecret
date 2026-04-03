"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

function isPublicPaymentPath(pathname: string | null) {
  if (!pathname) {
    return false;
  }

  return /^\/p\/[^/]+\/payment$/.test(pathname);
}

export function AppShell({
  children,
  defaultHeader,
  defaultFooter
}: Readonly<{
  children: ReactNode;
  defaultHeader: ReactNode;
  defaultFooter: ReactNode;
}>) {
  const pathname = usePathname();
  const usePaymentLayout = isPublicPaymentPath(pathname);

  return (
    <div className="flex min-h-screen flex-col">
      {usePaymentLayout ? null : defaultHeader}
      <main
        className={
          usePaymentLayout
            ? "mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8"
            : "mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8"
        }
      >
        {children}
      </main>
      {usePaymentLayout ? null : defaultFooter}
    </div>
  );
}
