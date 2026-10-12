"use client";

import { ArrowUp } from "lucide-react";
import { COUPLE, WEDDING } from "@/lib/constants";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { SplitHeading } from "@/components/Motion";

export default function Footer() {
  const ref = useGsapReveal({ stagger: 0.12 });

  return (
    <footer className="relative px-6 pt-[14vh] pb-10 text-ink md:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <p className="eyebrow text-center text-ink/60">With love</p>
        <SplitHeading as="p" className="display mt-6 text-center text-[clamp(2.4rem,11vw,11rem)] leading-[0.95]">
          {COUPLE.partner1} <span className="font-script text-[0.65em] text-gold">&amp;</span>{" "}
          <em>{COUPLE.partner2}</em>
        </SplitHeading>

        <div
          ref={ref}
          className="mt-14 flex flex-col items-center gap-6 border-t border-ink/15 pt-7 md:mt-20 md:flex-row md:justify-between"
        >
          <p className="eyebrow text-ink/60">
            {WEDDING.date} · {WEDDING.location}
          </p>
          <p className="eyebrow text-gold">{WEDDING.hashtag}</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="eyebrow group inline-flex items-center gap-3 text-ink/60 transition-colors duration-500 hover:text-ink"
          >
            Back to the source
            <span className="grid h-10 w-10 place-items-center rounded-full border border-ink/25 transition-all duration-500 ease-expo group-hover:-translate-y-1 group-hover:border-gold group-hover:text-gold">
              <ArrowUp size={14} strokeWidth={1.5} />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
