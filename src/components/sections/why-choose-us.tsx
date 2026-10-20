import Image from "next/image";
import { MessageSquare, ShieldCheck, Timer, Wrench } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

const points = [
  {
    title: "Convenience first",
    description:
      "We travel to your location so you can keep your day moving while your vehicle gets the attention it needs.",
    icon: Timer,
  },
  {
    title: "Straightforward communication",
    description:
      "Expect plain-language explanations of findings and options — no pressure tactics, no mystery recommendations.",
    icon: MessageSquare,
  },
  {
    title: "Dependable workmanship",
    description:
      "Careful inspections and practical repairs focused on helping you get back on the road with confidence.",
    icon: Wrench,
  },
  {
    title: "Local customer service",
    description:
      "A Rochester-area mobile shop built around responsive scheduling and respectful service in your community.",
    icon: ShieldCheck,
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-[var(--black)] py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <FadeIn>
          <div className="relative aspect-[4/5] overflow-hidden border border-white/10 sm:aspect-[5/4] lg:aspect-[4/5]">
            <Image
              src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=1400&q=80"
              alt="Technician performing careful under-hood automotive inspection"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-[var(--black)] via-transparent to-transparent"
              aria-hidden
            />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-[0.08em] text-white">
                Premium mobile service
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Performance-minded care with modern convenience.
              </p>
            </div>
          </div>
        </FadeIn>

        <div>
          <FadeIn>
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.24em] text-[var(--neon)]">
              Why Choose Us
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl font-bold uppercase tracking-[0.04em] text-white sm:text-5xl">
              Built for busy drivers
            </h2>
            <p className="mt-4 text-[var(--muted)]">
              Rochester Mobile Auto Repair combines automotive expertise with
              the convenience of on-location service — so quality repairs fit
              into real life.
            </p>
          </FadeIn>

          <div className="mt-8 space-y-5">
            {points.map((point, index) => (
              <FadeIn key={point.title} delay={0.05 * index}>
                <div className="flex gap-4 border-l-2 border-[var(--neon)]/40 pl-4">
                  <point.icon
                    className="mt-0.5 h-5 w-5 shrink-0 text-[var(--neon)]"
                    aria-hidden
                  />
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.08em] text-white">
                      {point.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                      {point.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
