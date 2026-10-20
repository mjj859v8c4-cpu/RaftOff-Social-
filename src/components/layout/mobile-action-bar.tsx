import Link from "next/link";
import { CalendarClock, Phone } from "lucide-react";
import { BUSINESS } from "@/lib/constants";

export function MobileActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[var(--black)]/95 backdrop-blur-md md:hidden">
      <div className="grid grid-cols-2 gap-2 px-3 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <a
          href={`tel:${BUSINESS.phoneTel}`}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[var(--neon)] font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.12em] text-[var(--black)] shadow-[0_0_20px_rgba(124,255,0,0.3)]"
        >
          <Phone className="h-4 w-4" />
          Call Now
        </a>
        <Link
          href="/book"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-[var(--neon)]/50 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.12em] text-[var(--neon)]"
        >
          <CalendarClock className="h-4 w-4" />
          Request Service
        </Link>
      </div>
    </div>
  );
}
