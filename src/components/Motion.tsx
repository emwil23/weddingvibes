"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Heading whose lines rise out of a mask when scrolled into view
export function SplitHeading({
  as = "h2",
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const split = SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
      autoSplit: true, // re-split when fonts load or the width changes
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 115,
          duration: 1.3,
          ease: "power4.out",
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }),
    });
    return () => split.revert();
  }, []);

  const Tag = as as "h2"; // one ref type for every allowed tag
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

// Poem that inks in word by word as it travels up the viewport
export function ScrubPoem({ lines, className }: { lines: string[]; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const split = SplitText.create(el.querySelectorAll("p"), { type: "words" });
    const tween = gsap.fromTo(
      split.words,
      { opacity: 0.16 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 55%", scrub: 0.6 },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      split.revert();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) =>
        line === "" ? <div key={i} className="h-[0.9em]" aria-hidden="true" /> : <p key={i}>{line}</p>
      )}
    </div>
  );
}
