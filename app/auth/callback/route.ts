import { NextResponse } from "next/server";
import { getCopy } from "@/lib/getCopy";
import { logServerError, logServerWarn } from "@/lib/logger";
import { normalizeInternalPath } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const copy = getCopy();
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeInternalPath(requestUrl.searchParams.get("next"), "/dashboard");
  const mode = requestUrl.searchParams.get("mode") === "signup" ? "signup" : "login";
  const fallbackPath = mode === "signup" ? "/signup" : "/login";

  const authError = requestUrl.searchParams.get("error_description") ?? requestUrl.searchParams.get("error");

  if (authError) {
    logServerWarn("auth.callback", "Supabase callback returned an auth error", {
      mode,
      next,
      authError
    });
    const fallbackUrl = new URL(fallbackPath, requestUrl.origin);
    fallbackUrl.searchParams.set("next", next);
    fallbackUrl.searchParams.set("error", authError);

    return NextResponse.redirect(fallbackUrl);
  }

  if (!code) {
    logServerWarn("auth.callback", "Missing auth code in callback", {
      mode,
      next
    });
    const fallbackUrl = new URL(fallbackPath, requestUrl.origin);
    fallbackUrl.searchParams.set("next", next);
    fallbackUrl.searchParams.set("error", copy.errors.authLinkInvalid);

    return NextResponse.redirect(fallbackUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    logServerError("auth.callback", "Failed to exchange auth code for session", error, {
      mode,
      next
    });
    const fallbackUrl = new URL(fallbackPath, requestUrl.origin);
    fallbackUrl.searchParams.set("next", next);
    fallbackUrl.searchParams.set("error", copy.errors.authFinalizeFailed);

    return NextResponse.redirect(fallbackUrl);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}


