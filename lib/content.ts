import { getCopy } from "@/lib/getCopy";

const copy = getCopy();
export const siteContent = {
  name: copy.common.siteName,
  title: copy.meta.title,
  description: copy.meta.description,
  footerBaseline: copy.footer.baseline
} as const;


