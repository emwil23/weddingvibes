"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

function formatName(raw: string): string {
  return raw
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Critical assets to preload before reveal (excludes the welcome video — tracked separately)
const DESKTOP_ASSETS = [
  "/illustrations/Bouquet_animated_black_202604261838.mp4",
  "/illustrations/Green_clear_background_202604212207.mp4",
  "/illustrations/save_the_date.mp4",
  "/illustrations/rsvp.mp4",
  "/illustrations/ghibli_couple.jpeg",
];
const MOBILE_ASSETS = [
  "/illustrations/bouquet_480.mp4",
  "/illustrations/Green_clear_background_202604212207_mobile.mp4",
  "/illustrations/save_the_date_mobile.mp4",
  "/illustrations/rsvp_mobile.mp4",
  "/illustrations/ghibli_couple.jpeg",
];

const MAX_WAIT_MS = 12000; // hard fallback — never stuck even if a fetch hangs

export default function LoadingScreen() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const slug = pathname.replace(/^\//, "").split("/")[0];
  const recipient = slug ? formatName(slug) : null;

  // Mutable load-tracking state (survives re-renders / video remount)
  const loadedRef = useRef(0);
  const totalRef = useRef(1);
  const finishedRef = useRef(false);
  const videoCountedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setProgress(100);
    setTimeout(() => {
      setDone(true);
      document.body.style.overflow = "";
    }, 500);
  }, []);

  const bump = useCallback(() => {
    loadedRef.current += 1;
    setProgress(Math.min(99, Math.round((loadedRef.current / totalRef.current) * 100)));
    if (loadedRef.current >= totalRef.current) finish();
  }, [finish]);

  // Wired to the video via JSX — survives the mobile/desktop key remount
  const handleVideoReady = useCallback(() => {
    if (videoCountedRef.current) return;
    videoCountedRef.current = true;
    bump();
  }, [bump]);

  useEffect(() => {
    const mobile = window.innerWidth <= 768;
    setIsMobile(mobile);
    document.body.style.overflow = "hidden";

    const assets = mobile ? MOBILE_ASSETS : DESKTOP_ASSETS;
    totalRef.current = assets.length + 1; // +1 = welcome video ready

    // Preload section assets — consume full body (.blob) so the whole file lands
    // in cache, not just response headers. Guarantees videos are fully downloaded.
    assets.forEach((url) => {
      fetch(url, { cache: "force-cache" })
        .then((r) => r.blob())
        .then(bump)
        .catch(bump);
    });

    // Video may already be ready before listener attaches
    if (videoRef.current && videoRef.current.readyState >= 3) handleVideoReady();

    // Hard fallback — never stuck even if a fetch or the video hangs
    const maxTimer = setTimeout(finish, MAX_WAIT_MS);

    return () => {
      clearTimeout(maxTimer);
      document.body.style.overflow = "";
    };
  }, [bump, finish, handleVideoReady]);

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
            key={isMobile ? "mobile" : "desktop"}
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="auto"
            loop
            onCanPlay={() => {
              if (videoRef.current) videoRef.current.playbackRate = 0.75;
            }}
            onCanPlayThrough={handleVideoReady}
            onError={handleVideoReady}
            className="absolute inset-0 w-full h-full object-cover"
          >
            {isMobile ? (
              <source src="/illustrations/envelope_mobile.mp4" type="video/mp4" />
            ) : (
              <>
                <source src="/illustrations/envelope_keyed.webm" type="video/webm" />
                <source src="/illustrations/envelope.mp4" type="video/mp4" />
              </>
            )}
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
                  transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
