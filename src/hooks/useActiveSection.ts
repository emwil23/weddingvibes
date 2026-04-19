"use client";

import { useEffect, useState } from "react";

// Tracks which section ID is currently visible using IntersectionObserver.
// Pass an array of section IDs (without #) in the order they appear on the page.
export function useActiveSection(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState<string>(sectionIds[0]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const observerCallback =
      (id: string) => (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        });
      };

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(observerCallback(id), {
        rootMargin: "-40% 0px -55% 0px",
        threshold: 0,
      });
      observer.observe(el);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [sectionIds]);

  return activeSection;
}
