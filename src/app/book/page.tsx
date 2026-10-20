import type { Metadata } from "next";
import Link from "next/link";
import { Phone } from "lucide-react";
import { BookingForm } from "@/components/forms/booking-form";
import { PageHero } from "@/components/sections/page-hero";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Book Mobile Auto Repair",
  description:
    "Request a mobile mechanic appointment in Rochester, Rochester Hills, and surrounding Michigan communities. Appointment requests are confirmed after we contact you.",
  alternates: { canonical: "/book" },
};

export default function BookPage() {
  return (
    <>
      <PageHero
        eyebrow="Book Service"
        title="Request an appointment"
        description="Share your vehicle details and preferred time window. We will review your request and contact you to confirm availability. Requests are not confirmed appointments until we reach out."
      />

      <section className="bg-[var(--black)] py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="border border-white/10 bg-[var(--charcoal)] p-6">
              <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.08em] text-white">
                Prefer to call?
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Speak with Rochester Mobile Auto Repair directly to discuss your
                vehicle and check same-day route availability.
              </p>
              <Button asChild className="mt-5 w-full sm:w-auto" size="lg">
                <a href={`tel:${BUSINESS.phoneTel}`}>
                  <Phone />
                  {BUSINESS.phoneDisplay}
                </a>
              </Button>
            </div>

            <div className="border border-white/10 bg-[var(--charcoal)] p-6">
              <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.08em] text-white">
                What happens next
              </h2>
              <ol className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                <li>1. Submit your request with vehicle and location details.</li>
                <li>2. We review availability for your preferred window.</li>
                <li>3. We contact you to confirm before any visit is scheduled.</li>
              </ol>
              <p className="mt-4 text-xs text-[var(--muted)]/80">
                Looking for service details first?{" "}
                <Link href="/services" className="text-[var(--neon)] hover:underline">
                  Browse services
                </Link>
                .
              </p>
            </div>
          </aside>

          <div className="border border-white/10 bg-[var(--charcoal)] p-6 sm:p-8">
            <BookingForm />
          </div>
        </div>
      </section>
    </>
  );
}
