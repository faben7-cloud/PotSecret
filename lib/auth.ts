import type { Session, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { normalizeInternalPath } from "@/lib/security";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

export function buildLoginRedirect(nextPath: string) {
  return `/login?next=${encodeURIComponent(normalizeInternalPath(nextPath))}`;
}

export async function requireUser(nextPath: string): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect(buildLoginRedirect(nextPath));
  }

  return user;
}
