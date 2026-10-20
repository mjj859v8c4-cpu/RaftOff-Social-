import { BadgeCheck, MapPinned, Scale, Sparkles } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

const highlights = [
  {
    title: "Mobile Convenience",
    description: "Service at your home, office, or driveway — no shop drop-off.",
    icon: MapPinned,
  },
  {
    title: "Honest Service",
    description: "Clear findings and straightforward recommendations before work begins.",
    icon: BadgeCheck,
  },
  {
    title: "Fair Pricing",
    description: "Practical options discussed up front so you can make informed decisions.",
    icon: Scale,
  },
  {
    title: "Quality Repairs",
    description: "Careful workmanship focused on getting you safely back on the road.",
    icon: Sparkles,
  },
];

export function TrustHighlights() {
  return (
    <section
      aria-label="Trust highlights"
      className="border-y border-white/10 bg-[var(--charcoal)]"
    >
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {highlights.map((item, index) => (
          <FadeIn key={item.title} delay={index * 0.06}>
            <div className="flex gap-4">
              <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[var(--neon)]/30 bg-[var(--dark-green)]/35 text-[var(--neon)]">
                <item.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg uppercase tracking-[0.08em] text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
