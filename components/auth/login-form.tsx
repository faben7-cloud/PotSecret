"use client";

import { type FormEvent, useState } from "react";
import { getCopy } from "@/lib/getCopy";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const copy = getCopy();
type AuthMode = "login" | "signup";

function getFriendlyError(message: string, mode: AuthMode) {
  const normalized = message.toLowerCase();

  if (normalized.includes("signups not allowed")) {
    return copy.errors.signupDisabled;
  }

  if (normalized.includes("email rate limit")) {
    return copy.errors.rateLimit;
  }

  if (normalized.includes("user not found")) {
    return copy.errors.userNotFound;
  }

  return message;
}

export function EmailAuthForm({
  next,
  mode,
  initialError
}: {
  next: string;
  mode: AuthMode;
  initialError?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    initialError ? "error" : "idle"
  );
  const [message, setMessage] = useState(initialError ?? "");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setStatus("error");
      setMessage(copy.errors.invalidEmail);
      return;
    }

    setStatus("loading");
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}&mode=${mode}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true
      }
    });

    if (error) {
      setStatus("error");
      setMessage(getFriendlyError(error.message, mode));
      return;
    }

    setStatus("success");
    setMessage(mode === "signup" ? copy.success.signupLinkSent : copy.success.loginLinkSent);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email">{copy.auth.form.emailLabel}</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={copy.auth.form.emailPlaceholder}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={status === "loading"}
          required
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading"
          ? copy.buttons.sending
          : mode === "signup"
            ? copy.buttons.receiveSignupLink
            : copy.buttons.receiveLoginLink}
      </button>

      {message ? (
        <p aria-live="polite" className={`text-sm ${status === "error" ? "text-red-600" : "text-pine"}`}>{message}</p>
      ) : null}
    </form>
  );
}



