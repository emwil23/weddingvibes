"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const EXPO = "power4.out";

type RevealType = "fadeUp" | "fadeIn" | "slideLeft" | "slideRight" | "scaleX";

interface Options {
  type?: RevealType;
  delay?: number;
  duration?: number;
  stagger?: number; // if set, animates direct children instead of root
}

export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(opts: Options = {}) {
  const { type = "fadeUp", delay = 0, duration = 0.9, stagger } = opts;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const from: gsap.TweenVars = { opacity: 0, willChange: "opacity, transform" };
    const to: gsap.TweenVars = { opacity: 1, willChange: "auto" };
    if (type === "fadeUp")    { from.y = 48;  to.y = 0; }
    if (type === "slideLeft") { from.x = 60;  to.x = 0; }
    if (type === "slideRight"){ from.x = -60; to.x = 0; }
    if (type === "scaleX")    { from.scaleX = 0; from.transformOrigin = "left center"; to.scaleX = 1; }

    const targets = stagger ? gsap.utils.toArray<HTMLElement>(el.children) : el;

    const ctx = gsap.context(() => {
      gsap.fromTo(targets, from, {
        ...to,
        duration,
        delay,
        ease: EXPO,
        stagger: stagger ?? 0,
        clearProps: "willChange",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true,
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return ref;
}
