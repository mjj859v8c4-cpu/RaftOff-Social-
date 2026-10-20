"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/constants";

export function HeroSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative isolate min-h-[min(92vh,900px)] overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=2400&q=80"
        alt="Professional automotive technician performing mobile vehicle service"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[var(--black)] via-[var(--black)]/88 to-[var(--black)]/45"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[var(--black)] via-transparent to-[var(--black)]/40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-[var(--neon)]/15 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[min(92vh,900px)] max-w-7xl flex-col justify-center px-4 pb-24 pt-20 sm:px-6 lg:px-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <p className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.28em] text-[var(--neon)]">
            {BUSINESS.name}
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl font-bold uppercase leading-[0.95] tracking-[0.02em] text-white sm:text-6xl md:text-7xl">
            Expert auto repair.
            <span className="mt-2 block text-[var(--neon)]">We come to you.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[var(--muted)] sm:text-lg">
            Skip the repair shop. Rochester Mobile Auto Repair brings convenient,
            reliable automotive service directly to your home, office, or
            driveway.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="xl">
              <a href={`tel:${BUSINESS.phoneTel}`}>
                <Phone />
                Call Now
              </a>
            </Button>
            <Button asChild variant="secondary" size="xl">
              <Link href="/book">Request Service</Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-[var(--muted)]">
            Serving Rochester, Rochester Hills, and surrounding communities ·{" "}
            <a
              href={`tel:${BUSINESS.phoneTel}`}
              className="font-semibold text-white underline-offset-4 hover:text-[var(--neon)] hover:underline"
            >
              {BUSINESS.phoneDisplay}
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
