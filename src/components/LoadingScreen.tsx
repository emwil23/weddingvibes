"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoadingScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    let frame: number;
    const start = performance.now();
    const duration = 5000;

    function tick(now: number) {
      const elapsed = now - start;
      const p = Math.min((elapsed / duration) * 95, 95);
      setProgress(p);
      if (p < 95) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);

    // Minimum 5s + window load, with a hard 12s cap so we never get stuck
    const minWait    = new Promise<void>((res) => setTimeout(res, 5000));
    const hardCap    = new Promise<void>((res) => setTimeout(res, 12000));
    const windowLoad = new Promise<void>((res) => {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", () => res(), { once: true });
    });

    Promise.all([minWait, Promise.race([windowLoad, hardCap])]).then(() => {
      cancelAnimationFrame(frame);
      setProgress(100);
      setTimeout(() => {
        setDone(true);
        document.body.style.overflow = "";
      }, 600);
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence onExitComplete={() => window.dispatchEvent(new Event("site-ready"))}>
      {!done && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-9999 overflow-hidden"
          style={{ backgroundColor: "#1C1A19" }}
        >
          {/* Full-screen video */}
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            loop
            onCanPlay={() => {
              if (videoRef.current) videoRef.current.playbackRate = 0.75;
            }}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/illustrations/envelope_keyed.webm" type="video/webm" />
            <source src="/illustrations/envelope.mp4" type="video/mp4" />
          </video>

          {/* Name + date */}
          <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center z-10">
            <p
              className="font-display text-cream/70"
              style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            >
              Emmanuel &amp; Tina
            </p>
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-cream/35 mt-3">
              July 21, 2026 · Guwahati
            </p>
          </div>

          {/* Progress bar — centered pill at bottom */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
            <div className="w-48 h-0.5 rounded-full overflow-hidden bg-cream/10">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(to right, #D4A5A0, #B87C77)",
                  boxShadow: "0 0 8px rgba(212, 165, 160, 0.6)",
                }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
