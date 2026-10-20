"use client";

import { Phone } from "lucide-react";
import { BUSINESS } from "@/lib/constants";

export function FloatingCallButton() {
  return (
    <a
      href={`tel:${BUSINESS.phoneTel}`}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--neon)] text-[var(--black)] shadow-[0_0_28px_rgba(124,255,0,0.45)] transition hover:scale-105 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black)] md:hidden"
      aria-label={`Call ${BUSINESS.name} at ${BUSINESS.phoneDisplay}`}
    >
      <Phone className="h-6 w-6" />
    </a>
  );
}
