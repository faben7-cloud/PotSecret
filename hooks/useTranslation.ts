"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { getLocaleFromPathname, getTranslator, locales, type Locale } from "@/lib/i18n";

export function useTranslation() {
  const pathname = usePathname();
  const locale = useMemo<Locale>(() => getLocaleFromPathname(pathname), [pathname]);
  const { t } = useMemo(() => getTranslator(locale), [locale]);

  return {
    locale,
    locales,
    t
  };
}
