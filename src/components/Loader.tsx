"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COUPLE, WEDDING } from "@/lib/constants";

// Everything the journey needs before the first scroll
const ASSETS = [
  "/illustrations/mountain_close_ink.webp",
  "/illustrations/mountain_ink.webp",
  "/illustrations/mountain_panorama_ink.webp",
];
const DESKTOP = [
  "/illustrations/Green_clear_background_202604212207.mp4",
  "/illustrations/save_the_date.mp4",
  "/illustrations/rsvp.mp4",
];
const MOBILE = [
  "/illustrations/Green_clear_background_202604212207_mobile.mp4",
  "/illustrations/save_the_date_mobile.mp4",
  "/illustrations/rsvp_mobile.mp4",
];

const MIN_SHOW_MS = 2600; // long enough to read the invitation line
const MAX_WAIT_MS = 15000; // never stuck, even if a fetch hangs

// The preloader is the story in miniature: two streams are drawn toward each other
// as the site loads, and meet as it finishes. Then the page opens onto the same rivers.
export default function Loader() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [guest, setGuest] = useState<string | null>(null);
  const shown = useRef(0);

  useEffect(() => {
    const slug = window.location.pathname.replace(/^\//, "").split("/")[0];
    setGuest(slug ? slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim() : null);
    document.body.style.overflow = "hidden";
    window.scrollTo(0, 0);

    const assets = [...ASSETS, ...(window.innerWidth <= 768 ? MOBILE : DESKTOP)];
    const started = performance.now();
    let loaded = 0;
    let finished = false;
    let raf = 0;

    function finish() {
      if (finished) return;
      finished = true;
      window.setTimeout(() => {
        setDone(true);
        document.body.style.overflow = "";
      }, Math.max(0, MIN_SHOW_MS - (performance.now() - started)));
    }

    // Read whole bodies so the films are truly cached, not just their headers
    const all = [...assets.map((url) => fetch(url, { cache: "force-cache" }).then((r) => r.blob())), document.fonts.ready];
    all.forEach((p) => p.catch(() => {}).then(() => (loaded += 1)));
    const maxTimer = window.setTimeout(() => (loaded = all.length), MAX_WAIT_MS);

    // Ease the drawn line toward the real figure so it flows instead of jumping
    let last = performance.now();
    function tick(now: number) {
      const target = loaded / all.length;
      // Time-based easing, so a slow device catches up instead of crawling
      shown.current += (target - shown.current) * (1 - Math.exp(-(now - last) / 220));
      last = now;
      if (target === 1 && shown.current > 0.995) {
        setProgress(1);
        finish();
        return;
      }
      setProgress(shown.current);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(maxTimer);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence
      onExitComplete={() => {
        document.documentElement.dataset.ready = "1"; // lets late mounts know the loader is gone
        window.dispatchEvent(new Event("site-ready"));
      }}
    >
      {!done && (
        <motion.div
          key="loader"
          role="status"
          aria-label="Loading the invitation"
          exit={{ clipPath: "inset(0% 0% 0% 100%)" }}
          transition={{ duration: 1.3, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-paper text-ink"
          style={{ clipPath: "inset(0% 0% 0% 0%)" }}
        >
          {/* Two streams, one from each side of the page, drawn as far as the load has come */}
          <svg
            viewBox="0 0 1200 600"
            preserveAspectRatio="none"
            fill="none"
            strokeLinecap="round"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <path
              d="M-20 150 C 180 90, 300 260, 470 250 S 560 300, 600 300"
              pathLength={1}
              stroke="var(--rose)"
              strokeWidth="2"
              strokeDasharray="1"
              strokeDashoffset={1 - progress}
            />
            <path
              d="M-20 470 C 160 520, 320 360, 470 350 S 560 300, 600 300"
              pathLength={1}
              stroke="var(--indigo)"
              strokeWidth="2"
              strokeDasharray="1"
              strokeDashoffset={1 - progress}
            />
            {/* …and the one river they become, once they have met */}
            <path
              d="M600 300 C 720 300, 800 250, 930 290 S 1120 330, 1220 300"
              pathLength={1}
              stroke="var(--gold)"
              strokeWidth="2.5"
              strokeDasharray="1"
              strokeDashoffset={progress >= 1 ? 0 : 1}
              style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
          </svg>

          <div className="relative flex flex-col items-center rounded-full bg-paper px-10 py-8 text-center shadow-[0_0_60px_40px_var(--paper)]">
            {/* CSS keyframes, not JS: the greeting must appear even while scripts are busy loading */}
            <p className="eyebrow animate-[rise_1.1s_var(--ease-expo)_0.15s_both] text-ink/60">
              {guest ? `For ${guest}` : "You are invited"}
            </p>
            <p className="display mt-4 animate-[rise_1.2s_var(--ease-expo)_0.3s_both] text-[clamp(2.4rem,7vw,4.5rem)]">
              {COUPLE.partner2} <span className="font-script text-[0.8em] text-gold">&amp;</span>{" "}
              <em>{COUPLE.partner1}</em>
            </p>
            <p className="mt-3 animate-[rise_1.2s_var(--ease-expo)_0.5s_both] font-serif text-lg italic text-ink/65">
              Two rivers, one journey
            </p>
          </div>

          <div className="eyebrow absolute inset-x-0 bottom-8 flex items-center justify-between px-6 text-ink/60 md:px-10">
            <span>
              {WEDDING.date} · {WEDDING.location}
            </span>
            <span className="tabular-nums" aria-hidden="true">
              {String(Math.round(progress * 100)).padStart(3, "0")}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
