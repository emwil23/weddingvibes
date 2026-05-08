"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { NOTE_POEM } from "@/lib/constants";
import { fadeUp, staggerContainer, staggerItem, VIEWPORT } from "@/hooks/useScrollAnimation";
import ChromakeyVideo from "@/components/ChromakeyVideo";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Timeline() {
  return (
    <section
      id="story"
      className="relative py-32 md:py-48 bg-cream dark:bg-charcoal overflow-hidden"
    >
      {/* Mountain background — blended into section */}
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
          src="/illustrations/mountain_close_1x.webp"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 100vw"
          className="object-cover opacity-[0.4] dark:opacity-[0.1]"
          draggable={false}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 md:px-20 lg:px-32">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-center">

          {/* Left — poem content */}
          <div className="relative z-10">
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

          {/* Right — walking animation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={VIEWPORT}
            transition={{ duration: 1.6, ease: EXPO, delay: 0.4 }}
            className="flex items-center justify-center pointer-events-none select-none"
          >
            <ChromakeyVideo
              webmSrc="/illustrations/walking_keyed.webm"
              mp4Src="/illustrations/Green_clear_background_202604212207.mp4"
              keyColor={[97, 133, 86]}
              className="w-full md:w-[130%] h-auto -ml-40 md:ml-0"
            />
          </motion.div>

        </div>
        </div>
    </section>
  );
}
