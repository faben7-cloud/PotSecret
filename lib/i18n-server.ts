import { headers } from "next/headers";
import { defaultLocale, isSupportedLocale } from "@/lib/i18n";

export function getRequestLocale() {
  const requestHeaders = headers();
  const locale = requestHeaders.get("x-potsecret-locale");

  return isSupportedLocale(locale) ? locale : defaultLocale;
}
