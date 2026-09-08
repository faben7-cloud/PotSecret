import { NextResponse, type NextRequest } from "next/server";
import { isSupportedLocale, stripLocaleFromPathname, toInternalPath } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const incomingPathname = new URL(request.url).pathname;
  const locale = incomingPathname.split("/")[1];
  if (!isSupportedLocale(locale)) return NextResponse.next();

  const pathname = toInternalPath(stripLocaleFromPathname(incomingPathname));
  // Only existing application routes: never API, Next assets, static files or health.
  const isApplicationRoute =
    pathname === "/" ||
    /^\/(?:login|signup|pots(?:\/new)?|auth\/callback)$/.test(pathname) ||
    /^\/dashboard(?:\/pots(?:\/[^/]+(?:\/payout)?)?)?$/.test(pathname) ||
    /^\/p\/[^/]+(?:\/(?:payment|success|cancel))?$/.test(pathname);

  if (!isApplicationRoute) return NextResponse.next();

  const destination = request.nextUrl.clone();
  destination.pathname = pathname;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-potsecret-locale", locale);
  return NextResponse.rewrite(destination, { request: { headers: requestHeaders } });
}

// Static literals are required by Next.js to compile the middleware matcher.
export const config = {
  matcher: ["/fr/:path*", "/en/:path*", "/es/:path*", "/it/:path*", "/de/:path*"]
};
