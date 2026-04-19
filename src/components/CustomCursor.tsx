"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

// Parse computed borderRadius and enforce a minimum so the overlay always looks rounded
function resolveRadius(raw: string): string {
  const px = parseFloat(raw);
  if (!isNaN(px) && px >= 8) return raw;
  return "10px";
}

const DOT_SIZE   = 18;
const PAD        = 5;
const DOT_SPRING   = { damping: 32, stiffness: 420, mass: 0.3 };
const MORPH_SPRING = { type: "spring" as const, damping: 28, stiffness: 480, mass: 0.28 };

interface HoverTarget {
  x: number; y: number;
  width: number; height: number;
  radius: string;
  originX: number; originY: number;
}

export default function CustomCursor() {
  const [isPointer, setIsPointer] = useState(false);
  useEffect(() => {
    setIsPointer(window.matchMedia("(pointer: fine)").matches);
  }, []);

  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);
  const dotX   = useSpring(mouseX, DOT_SPRING);
  const dotY   = useSpring(mouseY, DOT_SPRING);

  const [hover,   setHover]   = useState<HoverTarget | null>(null);
  const [visible, setVisible] = useState(false);
  // State (not ref) so it's safe to read during render as a key prop
  const [morphKey, setMorphKey] = useState(0);

  useEffect(() => {
    if (!isPointer) return;

    const onMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      setVisible(true);
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        'button, a, input, textarea, select, [role="button"]'
      );
      if (!el) return;

      const r = el.getBoundingClientRect();
      setMorphKey((k) => k + 1);
      setHover({
        x: r.left  - PAD,
        y: r.top   - PAD,
        width:  r.width  + PAD * 2,
        height: r.height + PAD * 2,
        radius: resolveRadius(getComputedStyle(el).borderRadius),
        originX: mouseX.get(),
        originY: mouseY.get(),
      });
    };

    const onOut = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>(
        'button, a, input, textarea, select, [role="button"]'
      );
      if (el) setHover(null);
    };

    const onScroll = () => setHover(null);
    const onLeave  = () => setVisible(false);
    const onEnter  = () => setVisible(true);

    document.addEventListener("mousemove",  onMove);
    document.addEventListener("mouseover",  onOver);
    document.addEventListener("mouseout",   onOut);
    document.addEventListener("scroll",     onScroll, true);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      document.removeEventListener("mousemove",  onMove);
      document.removeEventListener("mouseover",  onOver);
      document.removeEventListener("mouseout",   onOut);
      document.removeEventListener("scroll",     onScroll, true);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [isPointer, mouseX, mouseY]);

  if (!isPointer) return null;

  return (
    <>
      {/* Dot — mix-blend-mode:difference auto-inverts on any bg color */}
      <motion.div
        className="fixed top-0 left-0 rounded-full pointer-events-none z-[9999]"
        style={{
          x: dotX, y: dotY,
          translateX: "-50%", translateY: "-50%",
          width: DOT_SIZE, height: DOT_SIZE,
          backgroundColor: "white",
          mixBlendMode: "difference",
        }}
        animate={{ opacity: visible ? 1 : 0, scale: hover ? 0 : 1 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
      />

      {/* Morphing overlay — re-mounts at cursor origin on each new button */}
      {hover && visible && (
        <motion.div
          key={morphKey}
          className="fixed top-0 left-0 pointer-events-none z-9998"
          initial={{
            // Start from the button's center so it expands symmetrically
            x: hover.x + hover.width  / 2 - DOT_SIZE / 2,
            y: hover.y + hover.height / 2 - DOT_SIZE / 2,
            width: DOT_SIZE, height: DOT_SIZE,
            borderRadius: "50%",
            opacity: 1,
          }}
          animate={{
            x: hover.x, y: hover.y,
            width: hover.width, height: hover.height,
            borderRadius: hover.radius,
            opacity: 1,
          }}
          exit={{ width: DOT_SIZE, height: DOT_SIZE, borderRadius: "50%", opacity: 0 }}
          transition={MORPH_SPRING}
          style={{
            backgroundColor: "var(--cursor-overlay)",
            boxShadow: "inset 0 0 0 1px var(--cursor-ring)",
          }}
        />
      )}
    </>
  );
}
