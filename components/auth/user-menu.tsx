import Link from "next/link";
import { signOutAction } from "@/app/auth/actions";
import { getCopy } from "@/lib/getCopy";

const copy = getCopy();
export function UserMenu({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/dashboard"
        className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink/80 hover:bg-white sm:inline-flex"
      >
        {copy.nav.dashboard}
      </Link>
      <div className="hidden rounded-full bg-white px-3 py-2 text-sm text-ink/75 lg:block">{email}</div>
      <form action={signOutAction}>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-ink/20"
        >
          {copy.nav.signOut}
        </button>
      </form>
    </div>
  );
}


