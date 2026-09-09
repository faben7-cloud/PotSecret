import "server-only";
import { headers } from "next/headers";
import { getBaseUrl } from "@/lib/env";

function parseHost(host: string | null, protocol: "http:" | "https:"): URL | null {
  // Accept one authority only: no credentials, paths, escapes or proxy lists.
  if (!host || /[\s\\/@?#,%]/.test(host)) return null;
  try {
    const url = new URL(protocol + "//" + host);
    return url.hostname && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

function isLoopback(url: URL): boolean {
  return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
}

export function getRequestBaseUrl(request?: Request): string {
  const requestHeaders = request?.headers ?? headers();
  const host = requestHeaders.get("host");

  // Vercel routes Host to this deployment, preserving its branch/custom alias.
  // Trust that platform boundary only on Vercel. Never use client Origin,
  // Referer, Forwarded or X-Forwarded-Host to select a redirect destination.
  // https://vercel.com/docs/headers/request-headers#host
  if (process.env.VERCEL === "1") {
    const publicUrl = parseHost(host, "https:");
    if (publicUrl && !publicUrl.port) return publicUrl.origin;
  }

  // Route Handlers expose the server-constructed URL of the incoming request.
  if (request) {
    const url = new URL(request.url);
    if ((url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password) {
      // Next middleware can normalize a loopback IP to localhost. Keep the
      // actual loopback host when the protocol and port still identify this server.
      const incoming = parseHost(host, url.protocol);
      if (incoming && isLoopback(url) && isLoopback(incoming) && incoming.port === url.port) {
        return incoming.origin;
      }
      return url.origin;
    }
  }

  // Outside Vercel, a Server Action has no Request URL. Restrict Host to the
  // configured origin; additionally support loopback during local development.
  const configured = new URL(getBaseUrl());
  const local = parseHost(host, "http:");
  if (local?.host === configured.host) return configured.origin;
  if (process.env.NODE_ENV !== "production" && local &&
      isLoopback(local)) {
    return local.origin;
  }
  return configured.origin;
}
