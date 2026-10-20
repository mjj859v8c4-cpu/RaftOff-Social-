import Link from "next/link";
import { Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { BUSINESS, NAV_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--charcoal)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--muted)]">
            {BUSINESS.tagline} Mobile auto repair serving Rochester, Rochester
            Hills, and surrounding Oakland and Macomb County communities.
          </p>
          <a
            href={`tel:${BUSINESS.phoneTel}`}
            className="mt-5 inline-flex items-center gap-2 text-base font-semibold text-[var(--neon)] transition hover:brightness-110"
          >
            <Phone className="h-4 w-4" />
            {BUSINESS.phoneDisplay}
          </a>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.18em] text-white">
            Navigate
          </h2>
          <ul className="mt-4 space-y-2">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[var(--muted)] transition hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.18em] text-white">
            Service Area
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
            {BUSINESS.serviceAreaSummary}
          </p>
          <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]/80">
            Appointment requests are not confirmed until we contact you to
            verify availability.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>
            © 2026 {BUSINESS.name}. All rights reserved.
          </p>
          <p>Mobile service · No walk-in shop address listed</p>
        </div>
      </div>
    </footer>
  );
}
