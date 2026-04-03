import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function PotsPage() {
  await requireUser("/pots");
  redirect("/dashboard/pots");
}
