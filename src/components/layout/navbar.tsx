"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { BUSINESS, NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--black)]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-[4.5rem] sm:px-6 lg:px-8">
        <Logo compact className="lg:hidden" />
        <Logo className="hidden lg:inline-flex" />

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium tracking-wide transition-colors",
                  active
                    ? "text-[var(--neon)]"
                    : "text-[var(--muted)] hover:text-white",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <a href={`tel:${BUSINESS.phoneTel}`}>
              <Phone className="h-4 w-4" />
              {BUSINESS.phoneDisplay}
            </a>
          </Button>
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/book">Request Service</Link>
          </Button>
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
}
