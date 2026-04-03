import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function NewPotPage() {
  await requireUser("/pots/new");
  redirect("/dashboard/pots/new");
}
