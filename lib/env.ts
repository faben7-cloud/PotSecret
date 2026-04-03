import "server-only";

function requireEnv(value: string | undefined, name: string): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return trimmed;
}

function optionalEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getRequiredEnv(name: string): string {
  switch (name) {
    case "NEXT_PUBLIC_SUPABASE_URL":
      return requireEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, name);
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY":
      return requireEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, name);
    case "SUPABASE_SERVICE_ROLE_KEY":
      return requireEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, name);
    case "STRIPE_SECRET_KEY":
      return requireEnv(process.env.STRIPE_SECRET_KEY, name);
    case "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY":
      return requireEnv(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, name);
    case "STRIPE_WEBHOOK_SECRET":
      return requireEnv(process.env.STRIPE_WEBHOOK_SECRET, name);
    case "NEXT_PUBLIC_SITE_URL":
      return requireEnv(process.env.NEXT_PUBLIC_SITE_URL, name);
    case "NEXT_PUBLIC_APP_URL":
      return requireEnv(process.env.NEXT_PUBLIC_APP_URL, name);
    default:
      throw new Error(`Unsupported environment variable: ${name}`);
  }
}

export function getOptionalEnv(name: string): string | undefined {
  switch (name) {
    case "NEXT_PUBLIC_SUPABASE_URL":
      return optionalEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
    case "NEXT_PUBLIC_SUPABASE_ANON_KEY":
      return optionalEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    case "SUPABASE_SERVICE_ROLE_KEY":
      return optionalEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
    case "STRIPE_SECRET_KEY":
      return optionalEnv(process.env.STRIPE_SECRET_KEY);
    case "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY":
      return optionalEnv(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    case "STRIPE_WEBHOOK_SECRET":
      return optionalEnv(process.env.STRIPE_WEBHOOK_SECRET);
    case "NEXT_PUBLIC_SITE_URL":
      return optionalEnv(process.env.NEXT_PUBLIC_SITE_URL);
    case "NEXT_PUBLIC_APP_URL":
      return optionalEnv(process.env.NEXT_PUBLIC_APP_URL);
    default:
      return undefined;
  }
}

export function getSupabaseUrl(): string {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function getSupabaseServiceRoleKey(): string {
  return getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getStripeSecretKey(): string {
  return getRequiredEnv("STRIPE_SECRET_KEY");
}

export function getStripeWebhookSecret(): string {
  return getRequiredEnv("STRIPE_WEBHOOK_SECRET");
}

export function getBaseUrl(): string {
  return (
    getOptionalEnv("NEXT_PUBLIC_SITE_URL") ??
    getOptionalEnv("NEXT_PUBLIC_APP_URL") ??
    "http://localhost:3000"
  );
}

export function getMetadataBase(): URL {
  try {
    return new URL(getBaseUrl());
  } catch {
    return new URL("http://localhost:3000");
  }
}