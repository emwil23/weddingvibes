"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { COUPLE, NAV_ITEMS, WEDDING } from "@/lib/constants";
import { scrollToChapter } from "@/lib/journey";

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const ROMAN = ["I", "II", "III", "IV", "V"];
const CHIP =
  "grid h-11 w-11 place-items-center rounded-full border border-ink/20 text-ink transition-colors duration-500 hover:border-ink";

export default function Navbar() {
  const [active, setActive] = useState(NAV_ITEMS[0].href.slice(1));
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  // Stay out of the way until the loader lifts
  useEffect(() => {
    const show = () => setReady(true);
    if (document.documentElement.dataset.ready) show();
    else window.addEventListener("site-ready", show, { once: true });
    return () => window.removeEventListener("site-ready", show);
  }, []);

  // The journey announces each chapter as the reader reaches it
  useEffect(() => {
    const onChapter = (e: Event) => setActive((e as CustomEvent<string>).detail);
    window.addEventListener("chapter", onChapter);
    return () => window.removeEventListener("chapter", onChapter);
  }, []);

  // Menu open: lock the page and let Escape close it
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const index = Math.max(0, NAV_ITEMS.findIndex((item) => item.href.slice(1) === active));

  return (
    <>
      <motion.header
        initial={false}
        animate={ready ? { y: 0, opacity: 1 } : { y: -24, opacity: 0 }}
        transition={{ duration: 1.2, ease: EXPO, delay: 0.9 }}
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 pt-4 md:px-8 md:pt-6"
      >
        <button
          type="button"
          onClick={() => scrollToChapter("hero")}
          aria-label="Back to the start"
          className={`${CHIP} font-script text-xl leading-none`}
        >
          <span className="translate-y-0.5">
            {COUPLE.partner1[0]}&amp;{COUPLE.partner2[0]}
          </span>
        </button>

        {/* Chapter marker: the numeral and title change as the river carries you on */}
        <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 overflow-hidden" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={active}
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              exit={{ y: "-110%" }}
              transition={{ duration: 0.6, ease: EXPO }}
              className="eyebrow flex items-center gap-3 py-1 text-ink/70"
            >
              <span className="font-serif text-base normal-case italic tracking-normal text-gold">{ROMAN[index]}.</span>
              {NAV_ITEMS[index].label}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Menu toggle: two bars that cross. The music button sits just left of it. */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-menu"
          className={`${CHIP} relative`}
        >
          <span
            className={`absolute h-px w-4 bg-current transition-transform duration-500 ease-expo ${
              open ? "rotate-45" : "-translate-y-[3px]"
            }`}
          />
          <span
            className={`absolute h-px w-4 bg-current transition-transform duration-500 ease-expo ${
              open ? "-rotate-45" : "translate-y-[3px]"
            }`}
          />
        </button>
      </motion.header>

      {/* Full-screen menu: the chapters of the journey */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: "circle(0% at calc(100% - 2.4rem) 2.4rem)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 2.4rem) 2.4rem)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 2.4rem) 2.4rem)" }}
            transition={{ duration: 0.9, ease: EXPO }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-paper-2 px-6 pt-28 pb-10 text-ink md:px-16 md:pt-36"
          >
            <ul className="flex flex-col gap-1 md:gap-2">
              {NAV_ITEMS.map((item, i) => (
                <li key={item.href} className="overflow-hidden">
                  <motion.button
                    type="button"
                    initial={{ y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.9, ease: EXPO, delay: 0.2 + i * 0.07 }}
                    onClick={() => {
                      setOpen(false);
                      scrollToChapter(item.href.slice(1));
                    }}
                    className="display group flex w-full items-baseline gap-5 py-1 text-left text-[clamp(2.6rem,9vw,6.5rem)]"
                  >
                    <span className="w-8 font-serif text-lg italic tracking-normal text-gold">{ROMAN[i]}.</span>
                    <span
                      className={`transition-transform duration-700 ease-expo group-hover:translate-x-4 ${
                        i === index ? "italic text-gold" : ""
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                </li>
              ))}
            </ul>
            <p className="eyebrow text-ink/55">
              {WEDDING.date} · {WEDDING.location} · {WEDDING.hashtag}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
