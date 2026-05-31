"use client";

import Image from "next/image";
import { BLEND_POEM } from "@/lib/constants";

export default function Gallery() {

  return (
    <section
      id="gallery"
      className="relative py-32 md:py-48 bg-charcoal dark:bg-cream overflow-hidden"
    >
      {/* Mountain panorama background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none select-none"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 5%, black 95%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "destination-in",
        }}
      >
        <Image
          src="/illustrations/mountain_panorama_1x.webp"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 100vw"
          className="object-cover opacity-[0.4] dark:opacity-[0.1]"
          draggable={false}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-8 md:px-20 lg:px-32">
        <div className="mb-16 md:mb-20">
          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-cream/40 dark:text-charcoal/40 mb-4">
            The Blend
          </p>
          <h2
            className="font-display text-cream dark:text-charcoal"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.95 }}
          >
            The Blend
          </h2>
        </div>

        <p
          className="font-body text-[10px] tracking-[0.25em] uppercase text-cream/35 dark:text-charcoal/35 mb-10"
        >
          {BLEND_POEM.title}
        </p>

        <div className="flex flex-col">
          {BLEND_POEM.lines.map((line, i) =>
            line === "" ? (
              <div key={i} className="h-6" />
            ) : (
              <p
                key={i}
                className="font-body text-cream/70 dark:text-charcoal/60 leading-relaxed"
                style={{ fontSize: "clamp(1rem, 1.8vw, 1.25rem)" }}
              >
                {line}
              </p>
            )
          )}
        </div>

        <div
          className="w-16 h-px bg-cream/20 dark:bg-charcoal/20 mt-16 mb-8"
        />

        <p
          className="font-display text-cream/50 dark:text-charcoal/40"
          style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)", letterSpacing: "-0.01em" }}
        >
          {BLEND_POEM.closing}
        </p>
      </div>
    </section>
  );
}
