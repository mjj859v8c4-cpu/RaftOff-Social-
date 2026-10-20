import { FadeIn } from "@/components/motion/fade-in";

type PageHeroProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[var(--charcoal)]">
      <div
        className="pointer-events-none absolute inset-0 texture-grid opacity-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-[var(--neon)]/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <FadeIn>
          {eyebrow && (
            <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.24em] text-[var(--neon)]">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-bold uppercase tracking-[0.04em] text-white sm:text-5xl md:text-6xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            {description}
          </p>
        </FadeIn>
      </div>
    </section>
  );
}
