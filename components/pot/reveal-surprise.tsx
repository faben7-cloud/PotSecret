"use client";

import { useMemo, useState } from "react";

type RevealSurpriseProps = {
  title: string;
  message?: string | null;
};

type ConfettiPiece = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  rotate: string;
  size: string;
  color: string;
};

const COLORS = ["#14B8A6", "#7C3AED", "#FF6B6B", "#F59E0B", "#0EA5E9", "#10B981"];

export function RevealSurprise({ title, message }: RevealSurpriseProps) {
  const [revealed, setRevealed] = useState(false);

  const confetti = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.45}s`,
        duration: `${2.2 + Math.random() * 1.8}s`,
        rotate: `${Math.floor(Math.random() * 360)}deg`,
        size: `${8 + Math.floor(Math.random() * 10)}px`,
        color: COLORS[index % COLORS.length]
      })),
    []
  );

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(180deg,#fff8ed_0%,#ffffff_100%)] p-6 ring-1 ring-black/5 shadow-[0_12px_40px_rgba(17,24,39,0.06)] sm:p-8">
      <div className="relative z-10 space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-medium tracking-[0.16em] text-[#0F766E]">Moment surprise</p>
          <h2 className="text-3xl font-semibold tracking-tight text-[#111827]">
            Révéler la surprise
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[#4B5563]">
            Quand le moment est venu, cliquez pour dévoiler la surprise dans une ambiance festive.
          </p>
        </div>

        {!revealed ? (
          <div className="rounded-[1.5rem] bg-white p-5 ring-1 ring-black/5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-[#111827]">Surprise verrouillée 🔒</p>
                <p className="text-sm leading-6 text-[#6B7280]">
                  Le contenu reste discret jusqu’au reveal final.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#14B8A6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#14B8A6]/20 transition hover:bg-[#0f9f90]"
              >
                Ouvrir la surprise
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-[1.5rem] bg-white p-6 ring-1 ring-[#14B8A6]/15 shadow-lg shadow-[#14B8A6]/10">
            <div className="space-y-3">
              <p className="text-sm font-medium tracking-[0.16em] text-[#0F766E]">Surprise révélée</p>
              <h3 className="text-2xl font-semibold text-[#111827]">{title}</h3>
              <p className="text-sm leading-7 text-[#374151]">
                {message?.trim() ||
                  "La cagnotte surprise est prête à être offerte. Merci à tous pour votre participation 💛"}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-full bg-[#14B8A6]/10 px-4 py-2 text-sm font-medium text-[#0F766E] ring-1 ring-[#14B8A6]/10">
                Débloqué
              </span>
              <span className="inline-flex items-center rounded-full bg-[#fff8ed] px-4 py-2 text-sm font-medium text-[#374151] ring-1 ring-black/5">
                Ambiance festive
              </span>
            </div>

            <button
              type="button"
              onClick={() => setRevealed(false)}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] transition hover:border-black/20"
            >
              Refermer
            </button>
          </div>
        )}
      </div>

      {revealed ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="absolute top-[-10%] rounded-sm"
              style={{
                left: piece.left,
                width: piece.size,
                height: `calc(${piece.size} * 1.8)`,
                backgroundColor: piece.color,
                transform: `rotate(${piece.rotate})`,
                animationName: "potsecret-confetti-fall",
                animationDuration: piece.duration,
                animationTimingFunction: "ease-in",
                animationDelay: piece.delay,
                animationFillMode: "forwards"
              }}
            />
          ))}
        </div>
      ) : null}

      <style jsx>{`
        @keyframes potsecret-confetti-fall {
          0% {
            transform: translate3d(0, -20px, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translate3d(0, 520px, 0) rotate(540deg);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}