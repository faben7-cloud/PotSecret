import { NextResponse } from "next/server";
import { localizeRequestPath } from "@/lib/i18n-server";
import { normalizeInternalPath } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestBaseUrl } from "@/lib/request-url";
import { logServerWarn } from "@/lib/logger";

const loginError = "Impossible de finaliser la connexion. Demandez un nouveau lien et ouvrez-le dans le même navigateur que celui utilisé pour la demande.";
const diagnosticCodes = new Set([
  "flow_state_not_found", "flow_state_expired", "otp_expired",
  "bad_code_verifier", "pkce_code_verifier_not_found"
]);

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = localizeRequestPath(normalizeInternalPath(requestUrl.searchParams.get("next"), "/dashboard"));
  const baseUrl = getRequestBaseUrl(request);
  const redirectTo = (path: string) => {
    const response = NextResponse.redirect(baseUrl + path);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  const fail = (reason: string, providerCode?: unknown) => {
    // Never log the callback URL, auth code, verifier, cookies or provider text.
    logServerWarn("auth.callback", "Magic Link authentication failed", {
      reason,
      providerCode: typeof providerCode === "string" && diagnosticCodes.has(providerCode) ? providerCode : "unknown"
    });
    const query = new URLSearchParams({ next, error: loginError });
    return redirectTo(localizeRequestPath("/login") + "?" + query.toString());
  };

  if (["error", "error_code", "error_description"].some(key => requestUrl.searchParams.has(key))) {
    return fail("supabase_error", requestUrl.searchParams.get("error_code"));
  }
  if (!code?.trim()) return fail("missing_code");

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return fail("exchange_error", error.code);
    if (!data?.session) return fail("missing_session");
  } catch {
    return fail("exchange_exception");
  }

  return redirectTo(next);
}
