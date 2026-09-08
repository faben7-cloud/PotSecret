import { localizeRequestPath } from "@/lib/i18n-server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function NewPotPage() {
  await requireUser("/pots/new");
  redirect(localizeRequestPath("/dashboard/pots/new"));
}
