import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  compact?: boolean;
};

export function Logo({ className, compact = false }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neon)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--black)]",
        className,
      )}
      aria-label="Rochester Mobile Auto Repair home"
    >
      <span
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[var(--neon)]/40 bg-[var(--dark-green)]/40 shadow-[0_0_18px_rgba(124,255,0,0.2)]"
        aria-hidden
      >
        <svg
          viewBox="0 0 40 40"
          className="h-7 w-7 text-[var(--neon)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="20"
            cy="20"
            r="11"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <circle cx="20" cy="20" r="3.2" fill="currentColor" />
          <path
            d="M20 6.5V10M20 30v3.5M6.5 20H10M30 20h3.5M10.4 10.4l2.5 2.5M27.1 27.1l2.5 2.5M29.6 10.4l-2.5 2.5M12.9 27.1l-2.5 2.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-[family-name:var(--font-display)] text-[1.05rem] font-bold uppercase tracking-[0.14em] text-white sm:text-lg">
          Rochester
        </span>
        {!compact && (
          <span className="mt-1 font-[family-name:var(--font-display)] text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--neon)] sm:text-xs">
            Mobile Auto Repair
          </span>
        )}
        {compact && (
          <span className="mt-1 font-[family-name:var(--font-display)] text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--neon)]">
            Mobile Auto
          </span>
        )}
      </span>
    </Link>
  );
}
