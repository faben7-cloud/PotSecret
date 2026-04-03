import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getMetadataBase } from "@/lib/env";
import { getCopy } from "@/lib/getCopy";

const copy = getCopy();

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: copy.meta.title,
  description: copy.meta.description,
  applicationName: copy.common.siteName,
  keywords: [...copy.meta.keywords],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: copy.meta.title,
    description: copy.meta.description,
    siteName: copy.common.siteName,
    type: "website",
    locale: "fr_FR"
  },
  twitter: {
    card: "summary_large_image",
    title: copy.meta.title,
    description: copy.meta.description
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <AppShell defaultHeader={<SiteHeader />} defaultFooter={<SiteFooter />}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
