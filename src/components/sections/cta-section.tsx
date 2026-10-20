import Link from "next/link";
import { Phone } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/constants";

type CTASectionProps = {
  headline?: string;
  supporting?: string;
};

export function CTASection({
  headline = "YOUR MECHANIC IS JUST A CALL AWAY.",
  supporting = "Need diagnostics, maintenance, or a repair you can schedule around your day? Call now or request service online.",
}: CTASectionProps) {
  return (
    <section className="relative overflow-hidden border-y border-[var(--neon)]/20 bg-[var(--dark-green)]/30 py-20 sm:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(124,255,0,0.18), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <FadeIn>
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold uppercase tracking-[0.06em] text-white sm:text-5xl md:text-6xl">
            {headline}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[var(--muted)]">
            {supporting}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl">
              <a href={`tel:${BUSINESS.phoneTel}`}>
                <Phone />
                Call {BUSINESS.phoneDisplay}
              </a>
            </Button>
            <Button asChild variant="secondary" size="xl">
              <Link href="/book">Request Service</Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
