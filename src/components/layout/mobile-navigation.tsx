"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS, NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X /> : <Menu />}
      </Button>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-0 top-16 z-40 bg-[var(--black)]/95 backdrop-blur-md"
        >
          <nav
            className="mx-auto flex max-w-lg flex-col gap-1 px-4 py-8"
            aria-label="Mobile"
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
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-md border border-transparent px-4 py-3 font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.12em] transition-colors",
                    active
                      ? "border-[var(--neon)]/30 bg-[var(--neon)]/10 text-[var(--neon)]"
                      : "text-white hover:bg-white/5",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-6 flex flex-col gap-3">
              <Button asChild size="lg">
                <a href={`tel:${BUSINESS.phoneTel}`} onClick={() => setOpen(false)}>
                  <Phone />
                  Call {BUSINESS.phoneDisplay}
                </a>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/book" onClick={() => setOpen(false)}>
                  Request Service
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
