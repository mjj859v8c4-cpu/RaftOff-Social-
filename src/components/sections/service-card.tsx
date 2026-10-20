import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/data/services";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  service: Service;
  className?: string;
};

export function ServiceCard({ service, className }: ServiceCardProps) {
  const Icon = service.icon;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col border border-white/10 bg-[var(--charcoal)] p-6 transition hover:border-[var(--neon)]/40 hover:shadow-[0_0_28px_rgba(124,255,0,0.08)]",
        className,
      )}
    >
      <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-md border border-[var(--neon)]/35 bg-[var(--dark-green)]/40 text-[var(--neon)] transition group-hover:shadow-[0_0_18px_rgba(124,255,0,0.25)]">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <h3 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-[0.08em] text-white">
        {service.title}
      </h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--muted)]">
        {service.summary}
      </p>
      <Link
        href={`/services#${service.slug}`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--neon)] transition group-hover:gap-3"
      >
        Learn More
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}
