import Link from "next/link";
import { redirect } from "next/navigation";
import { EmailAuthForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth";
import { getCopy } from "@/lib/getCopy";
import { normalizeInternalPath } from "@/lib/security";

const copy = getCopy();
export default async function SignupPage({
  searchParams
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const next = normalizeInternalPath(params?.next, "/dashboard");
  const error = params?.error;
  const session = await getCurrentSession();

  if (session) {
    redirect(next);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold text-ink">{copy.auth.signupPage.title}</h1>
        <p className="text-sm leading-6 text-ink/70">{copy.auth.signupPage.description}</p>
      </div>
      <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-card">
        <EmailAuthForm mode="signup" next={next} initialError={error} />
      </div>
      <p className="text-center text-sm text-ink/65">
        {copy.auth.signupPage.hasAccount}{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-coral hover:text-coral/80">
          {copy.buttons.loginLink}
        </Link>
      </p>
    </div>
  );
}


