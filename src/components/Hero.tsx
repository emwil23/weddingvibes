"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { COUPLE, WEDDING, HERO_TAGLINE } from "@/lib/constants";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.18, delayChildren: 0.3 } },
};

const lineVariant = {
  hidden: { opacity: 0, y: 56 },
  visible: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EXPO } },
};

const rulerVariant = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 1.4, ease: EXPO, delay: 0.6 },
  },
};

const subtleVariant = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 1.4, ease: EXPO, delay: 1.1 } },
};

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    function startVideo() {
      if (videoRef.current) {
        videoRef.current.playbackRate = 0.4;
        videoRef.current.play();
      }
    }
    window.addEventListener("site-ready", startVideo, { once: true });
    return () => window.removeEventListener("site-ready", startVideo);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-cream dark:bg-charcoal"
      style={{
        // Vignette on the section itself — fades all edges to background
        boxShadow: "inset 0 0 120px 60px var(--background)",
      }}
    >
      {/* Background video — plays once, freezes on last frame */}
      <div
        className="absolute inset-0 z-0"
        style={{
          maskImage: "radial-gradient(ellipse 75% 70% at center, black 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at center, black 20%, transparent 75%)",
        }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          onEnded={() => {
            if (videoRef.current) videoRef.current.pause();
          }}
          className="w-full h-full object-cover"
          style={{ opacity: 0.45 }}
        >
          {/* Mobile — smallest, loads fastest */}
          <source src="/illustrations/white_rose_720.webm" type="video/webm" media="(max-width: 768px)" />
          <source src="/illustrations/white_rose_720.mp4" type="video/mp4" media="(max-width: 768px)" />
          {/* Desktop — WebM first (better compression), MP4 fallback */}
          <source src="/illustrations/white_rose_1080.webm" type="video/webm" />
          <source src="/illustrations/white_rose_720.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Date label */}
        <motion.p
          variants={lineVariant}
          className="font-body text-[10px] tracking-[0.3em] uppercase text-charcoal/50 dark:text-cream/40 mb-12"
        >
          {WEDDING.dateShort}
        </motion.p>

        {/* Partner 1 name */}
        <motion.h1
          variants={lineVariant}
          className="font-display text-charcoal dark:text-cream select-none"
          style={{ fontSize: "clamp(3.5rem, 9vw, 9rem)", letterSpacing: "0.01em", lineHeight: 1.2 }}
        >
          {COUPLE.partner2}
        </motion.h1>

        {/* Ampersand separator */}
        <motion.span
          variants={rulerVariant}
          className="font-display text-charcoal/20 dark:text-cream/15 select-none"
          style={{ fontSize: "clamp(3rem, 7vw, 7rem)", lineHeight: 1, marginTop: "-0.3em", marginBottom: "-0.3em" }}
        >
          &amp;
        </motion.span>

        {/* Partner 2 name */}
        <motion.h1
          variants={lineVariant}
          className="font-display text-charcoal dark:text-cream select-none"
          style={{ fontSize: "clamp(3.5rem, 9vw, 9rem)", letterSpacing: "0.01em", lineHeight: 1.5 }}
        >
          {COUPLE.partner1}
        </motion.h1>

        {/* Date + location + tagline */}
        <motion.div
          variants={subtleVariant}
          className="mt-12 flex flex-col items-center gap-1"
        >
          {HERO_TAGLINE.map((line, i) => (
            <p key={i} className="font-body text-[12px] tracking-[0.08em] text-charcoal/40 dark:text-cream/35 italic">
              {line}
            </p>
          ))}
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          variants={subtleVariant}
          className="mt-20 flex flex-col items-center gap-3"
        >
          <span className="font-body text-[9px] tracking-[0.3em] uppercase text-charcoal/30 dark:text-cream/25">
            Scroll
          </span>
          <div className="relative w-px h-12 overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 w-full h-full bg-charcoal/40 dark:bg-cream/30"
              animate={{ y: ["0%", "100%"] }}
              transition={{
                duration: 1.4,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: 0.6,
              }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Corner hashtag */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 2.2 }}
        className="absolute bottom-8 right-8 md:right-12 text-right z-10"
      >
        <p className="font-body text-[9px] tracking-[0.28em] uppercase text-charcoal/25 dark:text-cream/20">
          {WEDDING.hashtag}
        </p>
      </motion.div>
    </section>
  );
}
