"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function formatName(raw: string): string {
  return raw
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

export default function LoadingScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const pathname = usePathname();
  const slug = pathname.replace(/^\//, "").split("/")[0];
  const recipient = slug ? formatName(slug) : null;

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Kick bar to 92% via CSS transition — reliable across all browsers
    const t1 = setTimeout(() => setProgress(92), 50);

    // Dismiss after 5s fixed — don't block on window.onload (videos are too large over network)
    const t2 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setDone(true);
        document.body.style.overflow = "";
      }, 600);
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
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

          {/* Recipient name on envelope */}
          {recipient && (
            <div
              className="absolute z-10 flex flex-col items-center"
              style={{
                top: "30%",
                left: "52%",
                transform: "translate(-50%, -50%) rotate(8deg)",
              }}
            >
              <p className="font-body text-[9px] tracking-[0.3em] uppercase text-charcoal/50 mb-1">To</p>
              <p
                className="font-display text-charcoal/75"
                style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)", letterSpacing: "0.01em" }}
              >
                {recipient}
              </p>
            </div>
          )}

          {/* Name + date — on the envelope */}
          <div
            className="absolute z-10 flex flex-col items-center"
            style={{
              top: "45%",
              left: "51%",
              transform: "translate(-50%, -50%) rotate(8deg)",
            }}
          >
            <p
              className="font-display text-charcoal/75"
              style={{ fontSize: "clamp(1.6rem, 3.5vw, 2.8rem)", letterSpacing: "0.01em" }}
            >
              Emmanuel &amp; Tina
            </p>
            <p className="font-body text-[9px] tracking-[0.3em] uppercase text-charcoal/45 mt-2">
              July 27, 2026 · Guwahati
            </p>
          </div>

          {/* Progress bar — centered pill at bottom */}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center z-10">
            <div className="w-48 h-0.5 rounded-full overflow-hidden bg-cream/10">
              <div
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(to right, #D4A5A0, #B87C77)",
                  boxShadow: "0 0 8px rgba(212, 165, 160, 0.6)",
                  width: `${progress}%`,
                  transition: progress === 0 ? "none" : progress < 100 ? "width 4.8s cubic-bezier(0.16, 1, 0.3, 1)" : "width 0.3s ease-out",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
