import "server-only";

export function getRequiredEnv(
  value: string | undefined,
  name: string
): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return trimmed;
}

export function getBaseUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (siteUrl) {
    return siteUrl.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}

export function getMetadataBase(): URL {
  return new URL(getBaseUrl());
}

export function getSupabaseUrl(): string {
  return getRequiredEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  );
}

export function getSupabaseAnonKey(): string {
  return getRequiredEnv(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export function getSupabaseServiceRoleKey(): string {
  return getRequiredEnv(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    "SUPABASE_SERVICE_ROLE_KEY"
  );
}

export function getStripeSecretKey(): string {
  return getRequiredEnv(
    process.env.STRIPE_SECRET_KEY,
    "STRIPE_SECRET_KEY"
  );
}

export function getStripeWebhookSecret(): string {
  return getRequiredEnv(
    process.env.STRIPE_WEBHOOK_SECRET,
    "STRIPE_WEBHOOK_SECRET"
  );
}

export function getResendApiKey(): string {
  return getRequiredEnv(
    process.env.RESEND_API_KEY,
    "RESEND_API_KEY"
  );
}

export function getEmailFrom(): string {
  return getRequiredEnv(
    process.env.EMAIL_FROM,
    "EMAIL_FROM"
  );
}