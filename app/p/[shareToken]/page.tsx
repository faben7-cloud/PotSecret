import Link from "next/link";
import { notFound } from "next/navigation";
import { ContributionForm } from "@/components/pot/contribution-form";
import { getPublicPotByToken, getPublicPotRevealContributions } from "@/lib/pots";
import { getTranslator, localizePathname } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n-server";
import { eventTypeLabel, formatCurrency, formatDate } from "@/lib/utils";

const MILESTONES = [25, 50, 75, 100] as const;

function clampProgress(value: number) {
  return Math.max(0, Math.min(100, value));
}

function renderTemplate(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function getRequiredMilestone(index: number) {
  return MILESTONES[Math.min(index, MILESTONES.length - 1)];
}

export default async function PublicPotPage({
  params
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  const locale = getRequestLocale();
  const { t } = getTranslator(locale);
  const pot = await getPublicPotByToken(shareToken);

  if (!pot) {
    notFound();
  }

  const safeContributions = await getPublicPotRevealContributions(shareToken);
  const totalCollectedCents = Number(pot.confirmed_total_amount) || 0;
  const participantsCount = Number(pot.confirmed_contribution_count) || 0;
  const goalAmountCents = typeof pot.goal_amount === "number" && pot.goal_amount > 0 ? pot.goal_amount : null;
  const hasGoal = goalAmountCents !== null;
  const progressPercent = clampProgress(
    safeContributions[0]?.pot_progress_percentage ??
      (hasGoal ? (totalCollectedCents / goalAmountCents) * 100 : totalCollectedCents > 0 ? 100 : 0)
  );

  const mysteryMode = pot.mystery_mode === true;
  const contributionIsOpen = pot.is_open;
  const safeEventType = String(pot.event_type) as keyof typeof eventTypeLabel;

  const unlockedHints = [
    t("public.pot.hint1"),
    t("public.pot.hint2"),
    t("public.pot.hint3"),
    t("public.pot.hint4")
  ];

  return (
    <div className="min-h-[78vh] bg-[linear-gradient(180deg,#f7efe0_0%,#f9f6ef_38%,#effaf8_100%)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_18px_60px_rgba(20,184,166,0.12)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-[#14B8A6]/12 px-3 py-1 font-semibold text-[#0f766e]">
                  {t("public.pot.badge")}
                </span>
                <span className="rounded-full bg-[#f5e8d6] px-3 py-1 text-[#7c5a2f]">
                  {eventTypeLabel[safeEventType] ?? "Event"}
                </span>
                {mysteryMode ? (
                  <span className="rounded-full bg-[#111827] px-3 py-1 text-white">{t("public.pot.mysteryMode")}</span>
                ) : null}
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">{pot.title}</h1>
                <p className="max-w-2xl text-base leading-7 text-[#475569]">
                  {pot.description || t("public.pot.descriptionFallback")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.5rem] bg-[#f7faf9] p-4 ring-1 ring-[#14B8A6]/10">
                  <p className="text-sm text-[#64748b]">{t("public.pot.raised")}</p>
                  <p className="mt-1 text-2xl font-semibold text-[#111827]">
                    {formatCurrency(totalCollectedCents, pot.currency)}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-[#fff8ef] p-4 ring-1 ring-[#e9d5b5]">
                  <p className="text-sm text-[#64748b]">{t("public.pot.participants")}</p>
                  <p className="mt-1 text-2xl font-semibold text-[#111827]">{participantsCount}</p>
                </div>
                <div className="rounded-[1.5rem] bg-[#f8fafc] p-4 ring-1 ring-black/5">
                  <p className="text-sm text-[#64748b]">{t("public.pot.eventDate")}</p>
                  <p className="mt-1 text-lg font-semibold text-[#111827]">{formatDate(pot.event_date)}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#participate"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#14B8A6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#14B8A6]/20 transition hover:bg-[#0f9f90]"
                >
                  {t("public.pot.participate")}
                </a>
                <Link
                  href={localizePathname("/", locale)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#14B8A6]/15 bg-white px-6 py-3 text-sm font-semibold text-[#111827] transition hover:border-[#14B8A6]/35"
                >
                  {t("public.pot.backToSite")}
                </Link>
              </div>
            </div>

            <div className="space-y-4 rounded-[1.75rem] bg-[linear-gradient(180deg,#f8fffd_0%,#ffffff_100%)] p-5 ring-1 ring-[#14B8A6]/10">
              <div>
                <p className="text-sm font-semibold text-[#0f766e]">{t("public.pot.progress")}</p>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  {hasGoal
                    ? renderTemplate(t("public.pot.progressWithGoal"), {
                        raised: formatCurrency(totalCollectedCents, pot.currency),
                        goal: formatCurrency(goalAmountCents, pot.currency)
                      })
                    : renderTemplate(t("public.pot.progressWithoutGoal"), {
                        raised: formatCurrency(totalCollectedCents, pot.currency)
                      })}
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="h-4 overflow-hidden rounded-full bg-[#e7f5f2]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#14B8A6_0%,#0f766e_100%)] transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs font-semibold text-[#64748b]">
                    {MILESTONES.map((milestone) => {
                      const active = progressPercent >= milestone;

                      return (
                        <div key={milestone} className="space-y-2">
                          <div className={`mx-auto h-3 w-3 rounded-full ${active ? "bg-[#14B8A6]" : "bg-[#d6e8e4]"}`} />
                          <p>{milestone}%</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {mysteryMode ? (
                  <div className="rounded-[1.25rem] bg-[#fff8ef] p-4 ring-1 ring-[#eadbc6]">
                    <p className="text-sm font-semibold text-[#111827]">{t("public.pot.hintUnlocksTitle")}</p>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{t("public.pot.hintUnlocksBody")}</p>
                  </div>
                ) : (
                  <div className="rounded-[1.25rem] bg-[#f8fafc] p-4 ring-1 ring-black/5">
                    <p className="text-sm font-semibold text-[#111827]">{t("public.pot.openParticipationTitle")}</p>
                    <p className="mt-2 text-sm leading-6 text-[#64748b]">{t("public.pot.openParticipationBody")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_12px_40px_rgba(17,24,39,0.06)]">
            <div>
              <h2 className="text-2xl font-semibold text-[#111827]">{t("public.pot.contributionsTitle")}</h2>
              <p className="mt-1 text-sm text-[#64748b]">{t("public.pot.contributionsDescription")}</p>
            </div>

            <div className="mt-6 space-y-4">
              {safeContributions.length === 0 ? (
                <div className="rounded-[1.5rem] bg-[#f8fafc] p-5 text-sm text-[#64748b] ring-1 ring-black/5">
                  {t("public.pot.noContributions")}
                </div>
              ) : (
                safeContributions.map((contribution, index) => {
                  const requiredMilestone = getRequiredMilestone(index);
                  const hasMessage = Boolean(contribution.message_body?.trim());
                  const displayName =
  contribution.visible_identity ||
  renderTemplate(t("public.pot.participant"), { index: index + 1 });
                  const visibleHint =
                    contribution.visible_hint_level_3 ||
                    contribution.visible_hint_level_2 ||
                    contribution.visible_hint_level_1;

                  return (
                    <article
                      key={`${contribution.created_at}-${index}`}
                      className="rounded-[1.5rem] bg-[linear-gradient(180deg,#ffffff_0%,#fbf8f2_100%)] p-5 ring-1 ring-black/5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-base font-semibold text-[#111827]">{displayName}</p>
                          <p className="mt-1 text-xs text-[#94a3b8]">
                            {new Date(contribution.created_at).toLocaleDateString(
                              locale === "en" ? "en-GB" : locale === "de" ? "de-DE" : locale === "it" ? "it-IT" : locale === "es" ? "es-ES" : "fr-FR"
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="rounded-[1.25rem] bg-white p-4 ring-1 ring-black/5">
                          <p className="text-sm leading-6 text-[#475569]">
                            {contribution.message_body || t("public.pot.messageFallback")}
                          </p>
                        </div>

                        {mysteryMode ? (
                          <div className="rounded-[1.25rem] bg-[#f2fbf9] p-4 ring-1 ring-[#14B8A6]/12">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f766e]">
                              {t("public.pot.hint")}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#475569]">
                              {contribution.visible_mystery_hint ||
                                visibleHint ||
                                (progressPercent >= requiredMilestone
                                  ? unlockedHints[index] || (hasMessage ? t("public.pot.hintFallbackMessage") : t("public.pot.hintFallbackSilent"))
                                  : renderTemplate(t("public.pot.unlockAt"), { progress: requiredMilestone }))}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <div id="participate" className="space-y-6">
            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_12px_40px_rgba(17,24,39,0.06)]">
              <h2 className="text-2xl font-semibold text-[#111827]">{t("public.pot.joinTitle")}</h2>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">{t("public.pot.joinDescription")}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[1.25rem] bg-[#f8fafc] p-4 ring-1 ring-black/5">
                  <p className="text-sm font-semibold text-[#111827]">{t("public.pot.softMysteryTitle")}</p>
                  <p className="mt-1 text-sm leading-6 text-[#64748b]">{t("public.pot.softMysteryBody")}</p>
                </div>
                <div className="rounded-[1.25rem] bg-[#fff8ef] p-4 ring-1 ring-[#eadbc6]">
                  <p className="text-sm font-semibold text-[#111827]">{t("public.pot.playfulMilestonesTitle")}</p>
                  <p className="mt-1 text-sm leading-6 text-[#64748b]">{t("public.pot.playfulMilestonesBody")}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_12px_40px_rgba(17,24,39,0.06)]">
              <ContributionForm shareToken={shareToken} currency={pot.currency} disabled={!contributionIsOpen} />
            </section>
          </div>
        </section>
      </div>
    </div>
  );
}
