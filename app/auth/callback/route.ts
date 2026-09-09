import { localizeRequestPath } from "@/lib/i18n-server";
import { normalizeInternalPath } from "@/lib/security";
﻿import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestBaseUrl } from "@/lib/request-url";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = localizeRequestPath(normalizeInternalPath(requestUrl.searchParams.get("next"), "/dashboard"));

  const supabase = await createSupabaseServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${getRequestBaseUrl(request)}${next}`);
}