"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.25;
    audio.loop = true;
  }, []);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => setPlaying(true));
    }
  }

  return (
    <>
      <audio ref={audioRef} src="/songs/theme.mp3" preload="auto" />

      <motion.button
        onClick={toggle}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        data-music
        className="fixed top-4 right-[4.25rem] z-50 flex flex-row-reverse items-center gap-2.5 group md:top-6 md:right-[5.5rem]"
        aria-label={playing ? "Pause music" : "Play music"}
      >
        {/* Icon circle */}
        <div className="relative grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink transition-colors duration-500 group-hover:border-ink">
          <AnimatePresence mode="wait">
            {playing ? (
              <motion.svg
                key="pause"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                width="12" height="14" viewBox="0 0 12 14" fill="none"
                className="text-ink"
              >
                <rect x="0" y="0" width="4" height="14" rx="1.5" fill="currentColor" />
                <rect x="8" y="0" width="4" height="14" rx="1.5" fill="currentColor" />
              </motion.svg>
            ) : (
              <motion.svg
                key="play"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.15 }}
                width="12" height="14" viewBox="0 0 12 14" fill="none"
                className="ml-0.5 text-ink"
              >
                <path d="M0 0L12 7L0 14V0Z" fill="currentColor" />
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Pulse ring when playing */}
          {playing && (
            <motion.span
              className="absolute inset-0 rounded-full border border-ink/30"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </div>

        {/* Animated bars label */}
        <div className="flex items-end gap-0.75 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {[1, 0.6, 0.9, 0.5].map((h, i) => (
            <motion.span
              key={i}
              className="w-0.75 rounded-full bg-ink"
              animate={playing ? { scaleY: [h, 0.3, h] } : { scaleY: 0.3 }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
              style={{ height: "100%", transformOrigin: "bottom" }}
            />
          ))}
        </div>
      </motion.button>
    </>
  );
}
