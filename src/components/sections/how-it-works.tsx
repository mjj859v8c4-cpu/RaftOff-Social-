import { CalendarCheck, CarFront, MapPinned } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

const steps = [
  {
    step: "01",
    title: "Request Service",
    description:
      "Call or submit an appointment request with your vehicle details and preferred time window.",
    icon: CalendarCheck,
  },
  {
    step: "02",
    title: "We Come to You",
    description:
      "A mobile mechanic travels to your home, office, or driveway once availability is confirmed.",
    icon: MapPinned,
  },
  {
    step: "03",
    title: "Get Back on the Road",
    description:
      "Receive convenient service without visiting a repair shop — and with clear communication throughout.",
    icon: CarFront,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[var(--black)] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.24em] text-[var(--neon)]">
            How It Works
          </p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-4xl font-bold uppercase tracking-[0.04em] text-white sm:text-5xl">
            Service without the shop visit
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">
            Three simple steps from request to repair — designed around your
            schedule and location.
          </p>
        </FadeIn>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {steps.map((item, index) => (
            <FadeIn key={item.step} delay={index * 0.08}>
              <div className="relative h-full border border-white/10 bg-gradient-to-b from-[var(--charcoal)] to-[var(--black)] p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="font-[family-name:var(--font-display)] text-5xl font-bold text-[var(--neon)]/25">
                    {item.step}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--neon)]/30 text-[var(--neon)]">
                    <item.icon className="h-5 w-5" aria-hidden />
                  </span>
                </div>
                <h3 className="mt-6 font-[family-name:var(--font-display)] text-2xl uppercase tracking-[0.08em] text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                  {item.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
