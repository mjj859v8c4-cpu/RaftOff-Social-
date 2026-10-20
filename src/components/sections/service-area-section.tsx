import Link from "next/link";
import { MapPin } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { SERVICE_AREAS } from "@/data/service-areas";
import { BUSINESS } from "@/lib/constants";

export function ServiceAreaSection() {
  return (
    <section className="bg-[var(--charcoal)] py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8">
        <FadeIn>
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.24em] text-[var(--neon)]">
            Service Area
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold uppercase tracking-[0.04em] text-white sm:text-5xl">
            Oakland & Macomb coverage
          </h2>
          <p className="mt-4 max-w-xl text-[var(--muted)]">
            {BUSINESS.serviceAreaSummary}
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {SERVICE_AREAS.map((area) => (
              <li key={area.slug}>
                <Link
                  href={`/service-areas#${area.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-[var(--neon)]"
                >
                  <MapPin className="h-4 w-4 text-[var(--neon)]" aria-hidden />
                  {area.name}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button asChild variant="secondary">
              <Link href="/service-areas">View All Service Areas</Link>
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div
            className="relative overflow-hidden border border-white/10 bg-[var(--black)] p-6 sm:p-8"
            aria-label="Geographic service area graphic for Rochester and surrounding Michigan communities"
          >
            <div
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  "radial-gradient(circle at 35% 40%, rgba(124,255,0,0.16), transparent 45%), radial-gradient(circle at 70% 65%, rgba(25,58,23,0.9), transparent 50%), linear-gradient(145deg, #0d1210, #171c1a 55%, #0a0e0c)",
              }}
              aria-hidden
            />
            <div className="relative">
              <p className="font-[family-name:var(--font-display)] text-xs uppercase tracking-[0.2em] text-[var(--neon)]">
                Michigan Metro North
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                {SERVICE_AREAS.map((area, index) => (
                  <div
                    key={area.slug}
                    className="border border-white/10 bg-white/5 px-3 py-4 text-center backdrop-blur-sm"
                    style={{
                      transform: index % 2 === 1 ? "translateY(10px)" : undefined,
                    }}
                  >
                    <p className="font-[family-name:var(--font-display)] text-sm uppercase tracking-[0.12em] text-white">
                      {area.name}
                    </p>
                    <p className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-[var(--muted)]">
                      {area.county} County
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-center text-xs text-[var(--muted)]">
                Surrounding communities available by request based on daily
                routing.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
