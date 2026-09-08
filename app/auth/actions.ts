"use server";

import { localizeRequestPath } from "@/lib/i18n-server";


import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(localizeRequestPath("/"));
}

