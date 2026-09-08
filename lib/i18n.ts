import de from "@/locales/de.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import it from "@/locales/it.json";

export const locales = ["fr", "en", "es", "it", "de"] as const;
export type Locale = (typeof locales)[number];

type Dictionary = Record<string, string>;

export const defaultLocale: Locale = "fr";

const dictionaries: Record<Locale, Dictionary> = {
  fr,
  en,
  es,
  it,
  de
};

function normalizePathname(pathname: string) {
  if (!pathname) {
    return "/";
  }

  if (pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

export function isSupportedLocale(value: string | null | undefined): value is Locale {
  return locales.includes((value ?? "") as Locale);
}

export function getLocaleFromPathname(pathname: string | null | undefined): Locale {
  const normalized = normalizePathname(pathname ?? "/");
  const [, maybeLocale] = normalized.split("/");

  if (isSupportedLocale(maybeLocale)) {
    return maybeLocale;
  }

  return defaultLocale;
}

export function stripLocaleFromPathname(pathname: string | null | undefined) {
  const normalized = normalizePathname(pathname ?? "/");
  const parts = normalized.split("/");
  const maybeLocale = parts[1];

  if (!isSupportedLocale(maybeLocale)) {
    return normalized;
  }

  const stripped = `/${parts.slice(2).join("/")}`;
  return stripped === "/" ? "/" : normalizePathname(stripped);
}

export function toInternalPath(pathname: string) {
  const normalized = normalizePathname(pathname);

  if (normalized === "/cagnotte") {
    return "/p";
  }

  if (normalized.startsWith("/cagnotte/")) {
    return normalized.replace("/cagnotte/", "/p/");
  }

  return normalized;
}

export function toPublicPath(pathname: string) {
  const normalized = normalizePathname(pathname);

  if (normalized === "/p") {
    return "/cagnotte";
  }

  if (normalized.startsWith("/p/")) {
    return normalized.replace("/p/", "/cagnotte/");
  }

  return normalized;
}

export function localizePathname(pathname: string, locale: Locale) {
  // Keep queries/fragments byte-for-byte, including duplicate parameters.
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return pathname;
  const suffixIndex = pathname.search(/[?#]/);
  const path = suffixIndex < 0 ? pathname : pathname.slice(0, suffixIndex);
  const suffix = suffixIndex < 0 ? "" : pathname.slice(suffixIndex);
  const stripped = stripLocaleFromPathname(path);
  if (/^\/(?:api|_next|health)(?:\/|$)/.test(stripped) || /^\/[^/]+\.[^/]+$/.test(stripped)) {
    return stripped + suffix;
  }
  const publicPath = toPublicPath(stripped);
  return (publicPath === "/" ? `/${locale}` : `/${locale}${publicPath}`) + suffix;
}

export function getDictionary(locale: Locale): Dictionary {
  return {
    ...dictionaries.fr,
    ...dictionaries[locale]
  };
}

export function translate(locale: Locale, key: string) {
  return dictionaries[locale][key] ?? dictionaries.fr[key] ?? key;
}

export function getTranslator(locale: Locale) {
  return {
    locale,
    t: (key: string) => translate(locale, key)
  };
}
