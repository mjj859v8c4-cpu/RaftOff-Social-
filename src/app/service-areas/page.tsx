import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { CTASection } from "@/components/sections/cta-section";
import { PageHero } from "@/components/sections/page-hero";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { SERVICE_AREAS } from "@/data/service-areas";
import { BUSINESS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Service Areas | Rochester & Surrounding Communities",
  description:
    "Mobile mechanic coverage for Rochester, Rochester Hills, Auburn Hills, Washington Township, Shelby Township, Troy, and nearby Oakland and Macomb County communities.",
  alternates: { canonical: "/service-areas" },
};

export default function ServiceAreasPage() {
  return (
    <>
      <PageHero
        eyebrow="Service Areas"
        title="Mobile auto repair near you"
        description={`Request availability in ${BUSINESS.serviceAreaSummary}`}
      />

      <section className="bg-[var(--black)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="max-w-3xl text-[var(--muted)]">
              Rochester Mobile Auto Repair provides on-location automotive
              service across metro north Michigan. Availability can vary by day
              and route density — call or submit a request to check whether we
              can reach your address in your preferred window.
            </p>
          </FadeIn>

          <div className="mt-12 space-y-8">
            {SERVICE_AREAS.map((area, index) => (
              <FadeIn key={area.slug} delay={Math.min(index * 0.04, 0.2)}>
                <article
                  id={area.slug}
                  className="scroll-mt-28 border border-white/10 bg-[var(--charcoal)] p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.2em] text-[var(--neon)]">
                        {area.county} County
                      </p>
                      <h2 className="mt-2 flex items-center gap-2 font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-[0.04em] text-white">
                        <MapPin className="h-6 w-6 text-[var(--neon)]" aria-hidden />
                        {area.name}
                      </h2>
                    </div>
                    <Button asChild size="sm">
                      <Link href="/book">Request Availability</Link>
                    </Button>
                  </div>
                  <p className="mt-4 max-w-3xl text-[var(--muted)]">
                    {area.summary}
                  </p>
                  <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                    {area.highlights.map((item) => (
                      <li
                        key={item}
                        className="border border-white/10 bg-[var(--black)]/40 px-3 py-3 text-sm text-[var(--muted)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-sm text-[var(--muted)]">
                    Need service in {area.name}? Call{" "}
                    <a
                      href={`tel:${BUSINESS.phoneTel}`}
                      className="font-semibold text-[var(--neon)] hover:underline"
                    >
                      {BUSINESS.phoneDisplay}
                    </a>{" "}
                    or{" "}
                    <Link href="/book" className="text-white underline-offset-4 hover:underline">
                      request an appointment online
                    </Link>
                    .
                  </p>
                </article>
              </FadeIn>
            ))}
          </div>

          <div className="mt-12 border border-[var(--neon)]/25 bg-[var(--dark-green)]/25 p-6 sm:p-8">
            <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-[0.06em] text-white">
              Outside these communities?
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
              Surrounding Oakland and Macomb County locations may be available
              depending on the day&apos;s route. Reach out with your ZIP code and
              we will let you know.
            </p>
            <Button asChild className="mt-5" variant="secondary">
              <a href={`tel:${BUSINESS.phoneTel}`}>
                <Phone />
                Call {BUSINESS.phoneDisplay}
              </a>
            </Button>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
