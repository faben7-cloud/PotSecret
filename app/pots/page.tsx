import { localizeRequestPath } from "@/lib/i18n-server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function PotsPage() {
  await requireUser("/pots");
  redirect(localizeRequestPath("/dashboard/pots"));
}
