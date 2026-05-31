"use client";

import { COUPLE, WEDDING } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="relative py-20 md:py-28 bg-charcoal dark:bg-cream overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-8 md:px-20 lg:px-32">
        <div
          className="flex flex-col items-center text-center gap-6"
        >
          {/* Monogram */}
          <p
            className="font-body text-cream/20 dark:text-charcoal/20"
            style={{ fontSize: "clamp(4rem, 10vw, 8rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
          >
            {COUPLE.partner1[0]}&thinsp;&amp;&thinsp;{COUPLE.partner2[0]}
          </p>

          <div className="w-8 h-px bg-cream/15 dark:bg-charcoal/15" />

          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-cream/35 dark:text-charcoal/35">
            {WEDDING.date} · {WEDDING.location}
          </p>

          <p className="font-body text-[9px] tracking-[0.2em] uppercase text-cream/20 dark:text-charcoal/20 mt-8">
            Made with love
          </p>
        </div>
      </div>
    </footer>
  );
}
