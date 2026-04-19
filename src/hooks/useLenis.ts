"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

// Initializes Lenis smooth scroll and returns the instance.
// Call this once in layout or a provider component.
export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Smooth scroll to a target element or selector
  const scrollTo = (target: string | HTMLElement, offset = 0) => {
    lenisRef.current?.scrollTo(target, { offset });
  };

  return { scrollTo, lenis: lenisRef };
}
