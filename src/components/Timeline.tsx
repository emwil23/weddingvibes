"use client";

import { motion } from "framer-motion";
import { NOTE_POEM } from "@/lib/constants";
import { fadeUp, staggerContainer, staggerItem, VIEWPORT } from "@/hooks/useScrollAnimation";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Timeline() {
  return (
    <section
      id="story"
      className="relative py-32 md:py-48 bg-cream dark:bg-charcoal overflow-hidden"
    >
      <div className="max-w-3xl mx-auto px-8 md:px-20 lg:px-32">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="mb-16 md:mb-20"
        >
          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-charcoal/40 dark:text-cream/35 mb-4">
            A note
          </p>
          <h2
            className="font-display text-charcoal dark:text-cream"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.95 }}
          >
            A Note
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="flex flex-col"
        >
          {NOTE_POEM.map((line, i) =>
            line === "" ? (
              <motion.div key={i} variants={staggerItem} className="h-6" />
            ) : (
              <motion.p
                key={i}
                variants={staggerItem}
                className="font-body text-charcoal/70 dark:text-cream/60 leading-relaxed"
                style={{ fontSize: "clamp(1rem, 1.8vw, 1.25rem)" }}
              >
                {line}
              </motion.p>
            )
          )}
        </motion.div>

        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.4, ease: EXPO }}
          style={{ transformOrigin: "left center" }}
          className="w-16 h-px bg-charcoal/20 dark:bg-cream/20 mt-16"
        />
      </div>
    </section>
  );
}
