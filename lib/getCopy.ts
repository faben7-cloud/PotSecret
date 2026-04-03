import { COPY, type AppCopy, type CopyLanguage } from "@/lib/copy";

export function getCopy(lang: CopyLanguage = "fr"): AppCopy {
  return COPY[lang] ?? COPY.fr;
}
