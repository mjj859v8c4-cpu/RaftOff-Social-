import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CTASection } from "@/components/sections/cta-section";
import { PageHero } from "@/components/sections/page-hero";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Our Mobile Mechanic Team",
  description:
    "Learn about Rochester Mobile Auto Repair — a local mobile mechanic service focused on convenience, transparent communication, and quality automotive work in Oakland and Macomb Counties.",
  alternates: { canonical: "/about" },
};

const placeholders = [
  {
    title: "Business history",
    body: "[Editable placeholder] Share how Rochester Mobile Auto Repair started, why mobile service matters to your customers, and what communities you set out to serve.",
  },
  {
    title: "Technician experience",
    body: "[Editable placeholder] Add technician background, years of hands-on automotive experience, specialty areas, and the approach your team takes on every visit.",
  },
  {
    title: "Qualifications",
    body: "[Editable placeholder] List verifiable credentials, training, or affiliations only after confirming them. Do not invent certifications or warranties.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Us"
        title="Local mobile repair. Built around convenience."
        description={`${BUSINESS.name} brings automotive expertise to your driveway across Rochester, Rochester Hills, and surrounding Oakland and Macomb County communities.`}
      />

      <section className="bg-[var(--black)] py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <FadeIn>
            <div className="relative aspect-[4/3] overflow-hidden border border-white/10">
              <Image
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80"
                alt="Automotive tools and equipment representing professional mobile repair work"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-[0.04em] text-white sm:text-4xl">
              Quality repairs without the shop visit
            </h2>
            <div className="mt-5 space-y-4 text-[var(--muted)]">
              <p>
                Getting a vehicle repaired should not require rearranging an
                entire day around a shop counter. Our mobile model is designed
                for drivers who want dependable automotive service at home,
                work, or another convenient location.
              </p>
              <p>
                We focus on clear communication, careful inspection, and
                practical recommendations. Before work begins, you will
                understand what we found and what options are available.
              </p>
              <p>
                {BUSINESS.tagline} That promise guides how we schedule visits,
                explain repairs, and serve neighbors across metro north
                Michigan.
              </p>
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

      <section className="border-y border-white/10 bg-[var(--charcoal)] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold uppercase tracking-[0.04em] text-white sm:text-4xl">
              Editable company details
            </h2>
            <p className="mt-4 max-w-2xl text-[var(--muted)]">
              The sections below are intentional placeholders so the business
              owner can add verified history, biographies, and qualifications
              before launch — without inventing credentials.
            </p>
          </FadeIn>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {placeholders.map((item, index) => (
              <FadeIn key={item.title} delay={index * 0.06}>
                <article className="h-full border border-dashed border-[var(--neon)]/30 bg-[var(--black)]/50 p-6">
                  <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.08em] text-[var(--neon)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                    {item.body}
                  </p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
