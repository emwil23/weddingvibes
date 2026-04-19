"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { NAV_ITEMS, COUPLE } from "@/lib/constants";

const SECTION_IDS = NAV_ITEMS.map((item) => item.href.replace("#", ""));
const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ─── Individual nav item — needs its own component to use useState for hover ──
function NavItem({
  item,
  index,
  isActive,
  onNavigate,
}: {
  item: { label: string; href: string };
  index: number;
  isActive: boolean;
  onNavigate: (href: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <li
      className="relative flex items-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Active section dot — slides between items via layoutId */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="nav-dot"
            className="absolute w-0.75 h-0.75 rounded-full bg-charcoal dark:bg-cream"
            style={{ left: "-14px" }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.35, ease: EXPO }}
          />
        )}
      </AnimatePresence>

      {/* Hover line — thin dash extending to the left of the nav text */}
      <motion.span
        animate={{
          width: hovered && !isActive ? 10 : 0,
          opacity: hovered && !isActive ? 0.45 : 0,
        }}
        transition={{ duration: 0.32, ease: EXPO }}
        className="absolute h-px bg-charcoal dark:bg-cream"
        style={{ left: "-22px", top: "50%" }}
        aria-hidden
      />

      {/* Small index that fades in on hover — editorial detail */}
      <motion.span
        animate={{
          opacity: hovered ? 1 : 0,
          y: hovered ? 0 : 4,
        }}
        transition={{ duration: 0.3, ease: EXPO }}
        className="absolute font-body text-[7px] tracking-widest text-charcoal/30 dark:text-cream/30 select-none"
        style={{
          top: "-16px",
          left: "50%",
          transform: "translateX(-50%)",
          writingMode: "horizontal-tb",
        }}
        aria-hidden
      >
        {String(index + 1).padStart(2, "0")}
      </motion.span>

      {/* Nav label */}
      <motion.button
        onClick={() => onNavigate(item.href)}
        animate={{
          x: hovered ? 3 : 0,
          opacity: isActive ? 1 : hovered ? 0.85 : 0.28,
        }}
        transition={{ duration: 0.4, ease: EXPO }}
        className="nav-label text-[10px] tracking-widest-2 uppercase font-body text-charcoal dark:text-cream"
      >
        {item.label}
      </motion.button>
    </li>
  );
}

export default function Navbar() {
  const activeSection = useActiveSection(SECTION_IDS);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const scrollTo = useCallback((href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* ── Desktop: fixed left-side vertical nav ── */}
      <nav className="fixed left-0 top-0 z-50 h-full hidden lg:flex flex-col items-center justify-between py-10 px-6 w-20">
        {/* Top monogram */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.6 }}
          className="text-xs tracking-widest-2 uppercase font-body text-charcoal/40 dark:text-cream/35 nav-label select-none"
        >
          {COUPLE.partner1[0]}&thinsp;&amp;&thinsp;{COUPLE.partner2[0]}
        </motion.div>

        {/* Nav links */}
        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="flex flex-col items-center gap-10"
        >
          {NAV_ITEMS.map((item, i) => (
            <NavItem
              key={item.href}
              item={item}
              index={i}
              isActive={activeSection === item.href.replace("#", "")}
              onNavigate={scrollTo}
            />
          ))}
        </motion.ul>

        {/* Dark mode toggle */}
        {mounted && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 2 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            whileHover={{ opacity: 1, scale: 1.15 }}
            className="text-charcoal/55 dark:text-cream/55 hover:text-charcoal dark:hover:text-cream transition-colors duration-300"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </motion.button>
        )}
      </nav>

      {/* ── Mobile: top bar ── */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-cream/90 dark:bg-charcoal/90 backdrop-blur-md border-b border-charcoal/5 dark:border-cream/5">
        <span className="font-body text-base text-charcoal dark:text-cream tracking-wide">
          {COUPLE.partner1[0]}&thinsp;&amp;&thinsp;{COUPLE.partner2[0]}
        </span>
        <div className="flex items-center gap-5">
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <button
              key={item.href}
              onClick={() => scrollTo(item.href)}
              className={`text-[10px] tracking-widest uppercase font-body transition-colors duration-300 ${
                activeSection === item.href.replace("#", "")
                  ? "text-charcoal dark:text-cream"
                  : "text-charcoal/40 dark:text-cream/40"
              }`}
            >
              {item.label}
            </button>
          ))}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-charcoal/50 dark:text-cream/50"
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
