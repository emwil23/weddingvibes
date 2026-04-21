"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { BLEND_POEM } from "@/lib/constants";
import { fadeUp, staggerContainer, staggerItem, VIEWPORT } from "@/hooks/useScrollAnimation";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Gallery() {
  return (
    <section
      id="gallery"
      className="relative py-32 md:py-48 bg-charcoal dark:bg-cream overflow-hidden"
    >
      {/* Mountain panorama background — blended into section */}
      <div
        className="absolute inset-0 z-0 pointer-events-none select-none"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "destination-in",
        }}
      >
        <Image
          src="/illustrations/mountain_panorama_1x.webp"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 100vw"
          className="object-cover opacity-[0.12] dark:opacity-[0.07]"
          draggable={false}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-8 md:px-20 lg:px-32">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="mb-16 md:mb-20"
        >
          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-cream/40 dark:text-charcoal/40 mb-4">
            The Blend
          </p>
          <h2
            className="font-display text-cream dark:text-charcoal"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.95 }}
          >
            The Blend
          </h2>
        </motion.div>

        {/* Poem title */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="font-body text-[10px] tracking-[0.25em] uppercase text-cream/35 dark:text-charcoal/35 mb-10"
        >
          {BLEND_POEM.title}
        </motion.p>

        {/* Poem lines */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="flex flex-col"
        >
          {BLEND_POEM.lines.map((line, i) =>
            line === "" ? (
              <motion.div key={i} variants={staggerItem} className="h-6" />
            ) : (
              <motion.p
                key={i}
                variants={staggerItem}
                className="font-body text-cream/70 dark:text-charcoal/60 leading-relaxed"
                style={{ fontSize: "clamp(1rem, 1.8vw, 1.25rem)" }}
              >
                {line}
              </motion.p>
            )
          )}
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.4, ease: EXPO }}
          style={{ transformOrigin: "left center" }}
          className="w-16 h-px bg-cream/20 dark:bg-charcoal/20 mt-16 mb-8"
        />

        {/* Closing line */}
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="font-display text-cream/50 dark:text-charcoal/40"
          style={{ fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)", letterSpacing: "-0.01em" }}
        >
          {BLEND_POEM.closing}
        </motion.p>


        </div>
    </section>
  );
}
