import Link from "next/link";
import { CTASection } from "@/components/sections/cta-section";
import { HeroSection } from "@/components/sections/hero-section";
import { HowItWorks } from "@/components/sections/how-it-works";
import { ServiceAreaSection } from "@/components/sections/service-area-section";
import { ServiceCard } from "@/components/sections/service-card";
import { TrustHighlights } from "@/components/sections/trust-highlights";
import { WhyChooseUs } from "@/components/sections/why-choose-us";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { SERVICES } from "@/data/services";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TrustHighlights />

      <section className="bg-[var(--black)] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.24em] text-[var(--neon)]">
                  Services
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold uppercase tracking-[0.04em] text-white sm:text-5xl">
                  Mobile repairs that fit your day
                </h2>
                <p className="mt-4 max-w-2xl text-[var(--muted)]">
                  From diagnostics to preventative maintenance, we bring
                  practical automotive service to your location.
                </p>
              </div>
              <Button asChild variant="secondary">
                <Link href="/services">View All Services</Link>
              </Button>
            </div>
          </FadeIn>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {SERVICES.map((service, index) => (
              <FadeIn key={service.slug} delay={index * 0.05}>
                <ServiceCard service={service} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />
      <WhyChooseUs />
      <ServiceAreaSection />
      <CTASection />
    </>
  );
}
