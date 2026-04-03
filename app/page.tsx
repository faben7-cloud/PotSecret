import Link from "next/link";
import type { ReactNode } from "react";
import { homeCopy } from "@/lib/home-copy";

const createSurpriseHref = "/dashboard/pots/new";

function Card({
  children,
  className = ""
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <div className={`rounded-[2rem] bg-white shadow-[0_12px_40px_rgba(17,24,39,0.06)] ring-1 ring-black/5 ${className}`}>
      {children}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="w-full space-y-6 pb-6 pt-2 sm:space-y-8 sm:pb-8">
      <section className="overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#f5efff_0%,#f8f5ff_45%,#ffffff_100%)] px-5 py-10 shadow-[0_18px_60px_rgba(126,87,194,0.08)] ring-1 ring-[#7C3AED]/8 sm:px-8 sm:py-12 lg:px-12 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
          <div className="space-y-8">
            <div className="space-y-5">
              <h1 className="whitespace-pre-line text-4xl font-semibold tracking-tight text-[#111827] sm:text-5xl lg:text-6xl">
                {homeCopy.hero.title}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[#374151] sm:text-lg sm:leading-8">
                {homeCopy.hero.subtitle}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={createSurpriseHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#14B8A6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#14B8A6]/20 transition hover:bg-[#0f9f90]"
              >
                {homeCopy.hero.primaryCta}
              </Link>
              <Link
                href="#comment-ca-marche"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#14B8A6]/15 bg-white/85 px-6 py-3 text-sm font-semibold text-[#111827] transition hover:border-[#14B8A6]/30 hover:bg-white"
              >
                {homeCopy.hero.secondaryCta}
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-[#4B5563]">
              {homeCopy.hero.reassurance.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 shadow-sm ring-1 ring-black/5"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -left-2 top-5 h-4 w-4 rounded-full bg-[#14B8A6]/30" />
            <div className="pointer-events-none absolute right-8 top-0 h-3 w-3 rounded-full bg-[#FF6B6B]/40" />
            <div className="pointer-events-none absolute bottom-10 left-10 h-2.5 w-2.5 rounded-full bg-[#8B5CF6]/35" />

            <Card className="relative p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#14B8A6]">{homeCopy.hero.preview.eyebrow}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-[#111827]">{homeCopy.hero.preview.title}</h2>
                </div>
                <span className="rounded-full bg-[#14B8A6]/10 px-3 py-1 text-xs font-semibold text-[#0F766E]">
                  {homeCopy.hero.preview.status}
                </span>
              </div>

              <div className="mt-6 rounded-[1.5rem] bg-[#f7faff] p-4 ring-1 ring-[#14B8A6]/10">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#6B7280]">{homeCopy.hero.preview.totalLabel}</p>
                    <p className="mt-2 text-3xl font-semibold text-[#111827]">{homeCopy.hero.preview.totalValue}</p>
                  </div>
                  <span className="rounded-full bg-[#FF6B6B]/10 px-3 py-1 text-xs font-semibold text-[#FF6B6B]">
                    {homeCopy.hero.preview.badge}
                  </span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                  <div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#14B8A6_0%,#7C3AED_100%)]" />
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-[#fff8f8] p-4 ring-1 ring-[#FF6B6B]/10">
                  <p className="text-sm font-semibold text-[#111827]">{homeCopy.hero.preview.messageTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#4B5563]">{homeCopy.hero.preview.messageBody}</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#f5f3ff] p-4 ring-1 ring-[#8B5CF6]/10">
                  <p className="text-sm font-semibold text-[#111827]">{homeCopy.hero.preview.privacyTitle}</p>
                  <p className="mt-2 text-sm leading-6 text-[#4B5563]">{homeCopy.hero.preview.privacyBody}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="space-y-6 py-4 sm:py-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
            {homeCopy.quickTrust.title}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {homeCopy.quickTrust.items.map((item, index) => (
            <Card key={item} className="p-6">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#14B8A6]/10 text-sm font-semibold text-[#14B8A6]">
                  {index + 1}
                </span>
                <p className="text-base leading-7 text-[#374151]">{item}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section id="comment-ca-marche" className="space-y-6 py-4 sm:py-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">{homeCopy.steps.title}</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {homeCopy.steps.items.map((step) => (
            <Card key={step.title} className="h-full p-6">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#14B8A6] text-sm font-semibold text-white">
                {step.icon}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-[#111827]">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#4B5563]">{step.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6 py-4 sm:py-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">{homeCopy.differentiators.title}</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {homeCopy.differentiators.items.map((item) => (
            <Card key={item.title} className="h-full p-6">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f3ff] text-lg font-semibold text-[#7C3AED]">
                {item.icon}
              </span>
              <h3 className="mt-5 text-xl font-semibold text-[#111827]">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#4B5563]">{item.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-6 py-4 sm:py-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">{homeCopy.occasions.title}</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {homeCopy.occasions.items.map((occasion) => (
            <span
              key={occasion}
              className="inline-flex items-center rounded-full bg-white px-4 py-3 text-sm font-medium text-[#374151] shadow-sm ring-1 ring-black/5"
            >
              {occasion}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-6 py-4 sm:py-6">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">{homeCopy.extendedTrust.title}</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homeCopy.extendedTrust.items.map((item) => (
            <Card key={item} className="p-6">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#14B8A6]/10 text-base text-[#14B8A6]">
                  ✦
                </span>
                <p className="text-sm font-medium leading-6 text-[#374151]">{item}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] bg-[linear-gradient(135deg,#111827_0%,#1f2937_100%)] px-6 py-10 text-center text-white shadow-[0_18px_60px_rgba(17,24,39,0.18)] sm:px-8 sm:py-12">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{homeCopy.finalCta.title}</h2>
          <p className="mt-4 text-sm leading-6 text-white/75 sm:text-base">{homeCopy.finalCta.subtitle}</p>
          <div className="mt-7">
            <Link
              href={createSurpriseHref}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#14B8A6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#14B8A6]/20 transition hover:bg-[#0f9f90]"
            >
              {homeCopy.finalCta.button}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
