import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PaymentPageFooter } from "@/components/layout/payment-page-footer";
import { PaymentPageHeader } from "@/components/layout/payment-page-header";
import { PaymentPageForm } from "@/components/pot/payment-page-form";
import { getPublicPotByToken } from "@/lib/pots";

const trustItems = [
  "Paiement sécurisé via Stripe",
  "Aucune création de compte nécessaire",
  "Montants individuels non visibles des autres participants"
] as const;

const faqItems = [
  {
    question: "Faut-il créer un compte pour payer ?",
    answer: "Non, vous pouvez contribuer sans créer de compte."
  },
  {
    question: "Le paiement est-il sécurisé ?",
    answer: "Oui, les paiements sont sécurisés via Stripe."
  },
  {
    question: "Mon montant est-il visible par les autres ?",
    answer: "Non, les montants individuels restent discrets."
  }
] as const;

function SoftCard({
  children,
  className = ""
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return (
    <div
      className={`rounded-[2rem] bg-white shadow-[0_12px_40px_rgba(17,24,39,0.06)] ring-1 ring-black/5 ${className}`}
    >
      {children}
    </div>
  );
}

export default async function PublicPotPaymentPage({
  params,
  searchParams
}: {
  params: Promise<{ shareToken: string }>;
  searchParams?: Promise<{ amount?: string }>;
}) {
  const { shareToken } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const pot = await getPublicPotByToken(shareToken);

  if (!pot) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffaf2_0%,#fffdf8_46%,#ffffff_100%)]">
      <PaymentPageHeader shareToken={shareToken} />

      <div className="space-y-6 py-6 sm:space-y-8 sm:py-8">
        <section>
          <SoftCard className="bg-[linear-gradient(180deg,#fff8ed_0%,#ffffff_100%)] p-6 sm:p-7">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-[#111827] sm:text-4xl">
                Votre contribution pour Anniversaire Julien 🎉
              </h1>
              <p className="text-base leading-7 text-[#374151]">
                Vous participez à une cagnotte surprise. Merci pour votre discrétion.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-[#374151] shadow-sm ring-1 ring-black/5">
                  12 participants
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-medium text-[#374151] shadow-sm ring-1 ring-black/5">
                  Clôture le 18 mai
                </span>
                <span className="inline-flex items-center rounded-full bg-[#14B8A6]/10 px-4 py-2 text-sm font-medium text-[#0F766E] shadow-sm ring-1 ring-[#14B8A6]/10">
                  Surprise en préparation
                </span>
              </div>
            </div>
          </SoftCard>
        </section>

        <section>
          <PaymentPageForm currency={pot.currency} initialAmount={resolvedSearchParams?.amount ?? ""} />
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-3 rounded-[2rem] bg-white px-5 py-5 shadow-[0_12px_40px_rgba(17,24,39,0.06)] ring-1 ring-black/5">
            {trustItems.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full bg-[#fff8ed] px-4 py-2 text-sm font-medium text-[#374151] ring-1 ring-black/5"
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">Besoin d’être rassuré ?</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {faqItems.map((item) => (
              <SoftCard key={item.question} className="p-6">
                <h3 className="text-lg font-semibold text-[#111827]">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-[#4B5563]">{item.answer}</p>
              </SoftCard>
            ))}
          </div>
        </section>
      </div>

      <PaymentPageFooter />
    </div>
  );
}
