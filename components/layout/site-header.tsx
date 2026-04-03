import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "@/components/auth/user-menu";
import { getCurrentUser } from "@/lib/auth";
import { getCopy } from "@/lib/getCopy";

const copy = getCopy();
const createSurpriseHref = "/dashboard/pots/new";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-[#14B8A6]/10 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#14B8A6]/10">
            <Image
              src="/logo.png"
              alt={copy.common.logoAlt}
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
              priority
            />
          </div>
          <span className="truncate text-lg font-semibold tracking-tight text-[#111827] sm:text-xl">
            {copy.common.siteName}
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href={createSurpriseHref}
                className="inline-flex items-center justify-center rounded-full bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#14B8A6]/20 transition hover:bg-[#0f9f90]"
              >
                {copy.buttons.createPot}
              </Link>
              <UserMenu email={user.email ?? copy.common.accountFallback} />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full px-3 py-2 text-sm font-medium text-[#111827] transition hover:bg-[#14B8A6]/8 hover:text-[#14B8A6] sm:px-4"
              >
                {copy.nav.login}
              </Link>
              <Link
                href={createSurpriseHref}
                className="inline-flex items-center justify-center rounded-full bg-[#14B8A6] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#14B8A6]/20 transition hover:bg-[#0f9f90] sm:px-5"
              >
                {copy.buttons.createPot}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
