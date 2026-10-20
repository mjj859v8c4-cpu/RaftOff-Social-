import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CTASection } from "@/components/sections/cta-section";
import { PageHero } from "@/components/sections/page-hero";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/data/services";
import { BUSINESS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Mobile Auto Repair Services",
  description:
    "Engine diagnostics, brake repair, battery service, oil changes, general repairs, and preventative maintenance — mobile auto repair in Rochester, MI and nearby communities.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Automotive service at your location"
        description={`Detailed mobile repair and maintenance options from ${BUSINESS.name}. Request service online or call ${BUSINESS.phoneDisplay} to check availability.`}
      />

      <div className="bg-[var(--black)]">
        {SERVICES.map((service, index) => {
          const Icon = service.icon;
          const reversed = index % 2 === 1;

          return (
            <section
              key={service.slug}
              id={service.slug}
              className="scroll-mt-28 border-b border-white/10"
            >
              <div
                className={`mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:px-8 lg:py-20 ${
                  reversed ? "lg:[&>*:first-child]:order-2" : ""
                }`}
              >
                <FadeIn>
                  <div className="relative aspect-[16/11] overflow-hidden border border-white/10">
                    <Image
                      src={service.image}
                      alt={service.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-[var(--black)]/70 via-transparent to-transparent"
                      aria-hidden
                    />
                  </div>
                </FadeIn>

                <FadeIn delay={0.08}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--neon)]/35 text-[var(--neon)]">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <p className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.2em] text-[var(--neon)]">
                      Mobile Service
                    </p>
                  </div>
                  <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-[0.04em] text-white sm:text-4xl">
                    {service.title}
                  </h2>
                  <p className="mt-4 text-[var(--muted)]">{service.description}</p>

                  <div className="mt-8 grid gap-8 sm:grid-cols-2">
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-white">
                        Common symptoms
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {service.symptoms.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-sm text-[var(--muted)]"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--neon)]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.16em] text-white">
                        Services available
                      </h3>
                      <ul className="mt-3 space-y-2">
                        {service.offerings.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-sm text-[var(--muted)]"
                          >
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--neon)]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button asChild>
                      <Link href="/book">Request Service</Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <a href={`tel:${BUSINESS.phoneTel}`}>
                        Call {BUSINESS.phoneDisplay}
                      </a>
                    </Button>
                  </div>
                </FadeIn>
              </div>
            </section>
          );
        })}
      </div>

      <CTASection
        headline="Ready for convenient auto service?"
        supporting="Tell us what your vehicle needs and where you are — we'll follow up to confirm availability."
      />
    </>
  );
}
