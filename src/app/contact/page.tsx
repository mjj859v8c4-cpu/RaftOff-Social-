import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, MapPinned, Phone } from "lucide-react";
import { ContactForm } from "@/components/forms/contact-form";
import { PageHero } from "@/components/sections/page-hero";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact Rochester Mobile Auto Repair by phone or message. Call (248) 928-4118 or request service for Rochester, Rochester Hills, and surrounding communities.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk with your local mobile mechanic"
        description="Call for the fastest response, or send a message and we will follow up. We are a mobile service — there is no walk-in shop address."
      />

      <section className="bg-[var(--black)] py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="space-y-6">
            <div className="border border-white/10 bg-[var(--charcoal)] p-6">
              <div className="flex items-center gap-3 text-[var(--neon)]">
                <Phone className="h-5 w-5" aria-hidden />
                <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.08em] text-white">
                  Call now
                </h2>
              </div>
              <a
                href={`tel:${BUSINESS.phoneTel}`}
                className="mt-4 inline-block font-[family-name:var(--font-display)] text-3xl font-bold tracking-[0.04em] text-[var(--neon)] hover:brightness-110"
              >
                {BUSINESS.phoneDisplay}
              </a>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Click to call from your phone. Best for urgent questions and
                same-day availability checks.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button asChild>
                  <a href={`tel:${BUSINESS.phoneTel}`}>Call Now</a>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/book">Appointment Request</Link>
                </Button>
              </div>
            </div>

            <div className="border border-white/10 bg-[var(--charcoal)] p-6">
              <div className="flex items-center gap-3 text-[var(--neon)]">
                <Clock3 className="h-5 w-5" aria-hidden />
                <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.08em] text-white">
                  Business hours
                </h2>
              </div>
              <ul className="mt-4 space-y-3">
                {BUSINESS.hoursPlaceholder.map((row) => (
                  <li
                    key={row.day}
                    className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <span className="text-white">{row.day}</span>
                    <span className="text-[var(--muted)]">{row.hours}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[var(--muted)]">
                {BUSINESS.hoursNote}
              </p>
            </div>

            <div className="border border-white/10 bg-[var(--charcoal)] p-6">
              <div className="flex items-center gap-3 text-[var(--neon)]">
                <MapPinned className="h-5 w-5" aria-hidden />
                <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.08em] text-white">
                  Service area
                </h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">
                {BUSINESS.serviceAreaSummary}
              </p>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Mobile appointments only — we come to your location. No physical
                shop walk-ins.
              </p>
              <Link
                href="/service-areas"
                className="mt-4 inline-block text-sm font-semibold text-[var(--neon)] hover:underline"
              >
                Explore service areas
              </Link>
            </div>
          </div>

          <div className="border border-white/10 bg-[var(--charcoal)] p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-[0.08em] text-white">
              Send a message
            </h2>
            <p className="mt-3 mb-6 text-sm text-[var(--muted)]">
              Use this form for general questions. For repair scheduling, the{" "}
              <Link href="/book" className="text-[var(--neon)] hover:underline">
                appointment request form
              </Link>{" "}
              collects the vehicle details we need.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
