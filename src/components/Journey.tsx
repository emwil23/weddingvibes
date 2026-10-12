"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ArrowUpRight, Plane, Train } from "lucide-react";
import {
  BLEND_POEM,
  COUPLE,
  HERO_TAGLINE,
  NOTE_POEM,
  ON_THE_DAY,
  ON_THE_DAY_NOTE,
  TRAVEL,
  VENUE,
  WEDDING,
} from "@/lib/constants";
import { journey, paperAt, smoothstep } from "@/lib/journey";
import ChromakeyVideo from "@/components/ChromakeyVideo";
import River, { streamY } from "@/components/River";
import { reducedMotion } from "@/components/Motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

// ─── The journey ─────────────────────────────────────────────────────────────
// One long scroll-painting. The page scrolls down; the world travels sideways:
// from the mountains where two streams rise, past the note, to the confluence,
// and on to Guwahati. The sun crosses the sky as you go and the paper warms to dusk.

const RIVER_BAND = 0.32; // share of the stage the river occupies — keep in step with the classes below
const FAR_SPEED = 0.3; // the mountains drift at this fraction of the world's speed

const stanzas = (lines: string[]) =>
  lines
    .join("\n")
    .split("\n\n")
    .map((s) => s.split("\n"));
const NOTE = stanzas(NOTE_POEM);
const BLEND = stanzas(BLEND_POEM.lines);
const NUMERALS = ["i", "ii", "iii", "iv", "v", "vi"];

const BLOCK = "flex h-full w-[84vw] shrink-0 flex-col justify-center md:w-[44vw] xl:w-[36vw]";
const POEM = "display text-[clamp(1.4rem,3.9svh,2.7rem)] leading-[1.22]";

// Lines that rise out of a mask when their block drifts into view
function Lines({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <p className={className}>
      {lines.map((line) => (
        <span key={line} className="block overflow-hidden py-[0.06em]">
          <span data-line className="block">{line}</span>
        </span>
      ))}
    </p>
  );
}

// Lean a card toward a mouse pointer; .tilt in globals.css reads these variables
function tilt(e: React.PointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  const y = (e.clientY - r.top) / r.height;
  el.style.setProperty("--ry", `${(x - 0.5) * 8}deg`);
  el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
  el.style.setProperty("--mx", `${x * 100}%`);
  el.style.setProperty("--my", `${y * 100}%`);
}
function untilt(e: React.PointerEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
}

function Postcard({ index, type, venue }: { index: string; type: string; venue: (typeof VENUE)["ceremony"] }) {
  return (
    <div data-block data-reveal className={BLOCK}>
      <a
        onPointerMove={tilt}
        onPointerLeave={untilt}
        href={`https://maps.google.com/?q=${encodeURIComponent(venue.name + " " + venue.address)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${type} at ${venue.name}, ${venue.address} — view on map`}
        className="tilt group relative flex flex-col rounded-[1.75rem] border border-ink/10 bg-paper-2 p-6 shadow-[0_24px_50px_-30px_rgb(43_38_34/0.5)] hover:border-gold/60 md:p-8"
      >
        <div className="flex items-start justify-between">
          <p className="eyebrow text-ink/55">
            <span className="font-serif text-base normal-case italic tracking-normal text-gold">{index}</span>
            &ensp;{type}
          </p>
          <span className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 transition-colors duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-paper-2">
            <ArrowUpRight size={15} strokeWidth={1.5} className="transition-transform duration-500 ease-expo group-hover:rotate-45" />
          </span>
        </div>
        <h3 className="display mt-[3svh] text-[clamp(2.2rem,6.5svh,4rem)]">{venue.name}</h3>
        <p className="mt-2 font-serif text-xl italic text-ink/65">
          {venue.address} · {venue.time}
        </p>
        <p className="mt-[2svh] max-w-sm text-sm leading-relaxed text-ink/60">{venue.description}</p>
        <span className="eyebrow mt-[2.5svh] text-ink/50 transition-colors duration-500 group-hover:text-gold">
          View on map
        </span>
      </a>
    </div>
  );
}

function Boat({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 30" className="h-7 w-9 animate-[bob_3.6s_ease-in-out_infinite] md:h-8 md:w-11" fill="none" strokeLinejoin="round">
      <path d="M20 3v15H8z" fill={color} stroke="var(--ink)" strokeWidth="0.8" />
      <path d="M20 7l10 11H20z" fill="var(--paper-2)" stroke="var(--ink)" strokeWidth="0.8" />
      <path d="M2 18h36l-7 9H9z" fill="var(--paper-2)" stroke="var(--ink)" strokeWidth="0.9" />
    </svg>
  );
}

export default function Journey() {
  const rootRef = useRef<HTMLElement>(null);
  const [month, day, year] = WEDDING.date.replace(",", "").split(" ");
  // Personalised links (/guest-name) greet the guest; set after mount because the static
  // 404 fallback is prerendered without the real path
  const [guest, setGuest] = useState<string | null>(null);
  useEffect(() => {
    const slug = window.location.pathname.replace(/^\//, "").split("/")[0];
    setGuest(slug ? slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim() : null);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion()) return;
    const q = gsap.utils.selector(root);
    const one = <T extends HTMLElement>(sel: string) => q(sel)[0] as T;
    const stage = one("[data-stage]");
    const track = one("[data-track]");
    const far = one("[data-far]");
    const sun = one("[data-sun]");
    const couple = one("[data-couple]");
    const boats = q("[data-boat]") as HTMLElement[];
    const panels = q("[data-panel]") as HTMLElement[];

    const distance = () => track.scrollWidth - window.innerWidth;
    const worldLeft = (el: Element) => el.getBoundingClientRect().left - track.getBoundingClientRect().left;

    // The section is as tall as the journey is long: 1px of scroll moves the world 1px
    function measure() {
      root!.style.height = `${distance() + window.innerHeight}px`;
      far.style.width = `${window.innerWidth + distance() * FAR_SPEED}px`;
      journey.sourceX = worldLeft(one("[data-source]"));
      journey.confluenceX = worldLeft(one("[data-confluence]"));
    }
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    const ctx = gsap.context(() => {
      const setFar = gsap.quickSetter(far, "x", "px");
      let chapter = "";

      // Everything that follows the world reads from this one update, so nothing drifts apart
      function paint(x: number, p: number) {
        journey.x = x;
        journey.progress = p;
        setFar(-x * FAR_SPEED);

        const [r, g, b] = paperAt(p);
        stage.style.backgroundColor = `rgb(${r | 0} ${g | 0} ${b | 0})`;

        // The sun rises over the source, peaks, and sets into the river at journey's end
        // It stays above the words all day and only drops once the last scene is reached
        const sx = 50 + 39 * p;
        const sy = 14 - 3 * Math.sin(Math.PI * p) + 45 * smoothstep(0.9, 1, p);
        sun.style.transform = `translate3d(${sx}vw, ${sy}svh, 0)`;
        sun.style.setProperty("--sun", `rgb(${243 - 10 * p | 0} ${216 - 96 * p * p | 0} ${150 - 70 * p | 0})`);

        // The couple steps in from the left once the journey begins
        couple.style.transform = `translate3d(${-110 * (1 - smoothstep(0.004, 0.05, p))}%, 0, 0)`;

        // Each boat keeps to its own stream until the two become one
        const riverH = stage.offsetHeight * RIVER_BAND;
        const aspect = stage.offsetWidth / riverH;
        boats.forEach((boat, i) => {
          const at = streamY(i ? 0.6 : 0.68, aspect, riverH, i ? "b" : "a");
          boat.style.transform = `translate3d(0, ${-at.y * riverH}px, 0)`;
          boat.style.opacity = String(at.grow);
        });

        // Tell the nav which chapter is under the reader
        const centre = x + window.innerWidth * 0.45;
        const here = panels.filter((el) => el.offsetLeft <= centre).pop()?.id ?? panels[0].id;
        if (here !== chapter) {
          chapter = here;
          window.dispatchEvent(new CustomEvent("chapter", { detail: here }));
        }
      }

      const travel = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 1, // the world eases after the scroll instead of snapping to it
          invalidateOnRefresh: true,
          // The film has them facing left, so it is mirrored to walk downstream; scrolling back turns them around
          onUpdate: (self) => gsap.to(one("[data-couple-face]"), { scaleX: -self.direction, duration: 0.5, overwrite: true }),
        },
        onUpdate() {
          paint(-Number(gsap.getProperty(track, "x")), this.progress());
        },
      });
      paint(0, 0);

      // Past the journey's end the page turns downward into the reply
      ScrollTrigger.create({
        trigger: document.getElementById("rsvp"),
        start: "top 55%",
        onEnter: () => window.dispatchEvent(new CustomEvent("chapter", { detail: "rsvp" })),
        onLeaveBack: () => window.dispatchEvent(new CustomEvent("chapter", { detail: chapter })),
      });

      // Blocks come alive as the world carries them into view
      (q("[data-reveal]") as HTMLElement[]).forEach((block) => {
        const at = { trigger: block, containerAnimation: travel, start: "left 84%", once: true };
        const lines = block.querySelectorAll("[data-line]");
        const rest = block.querySelectorAll("[data-rise]");
        if (lines.length)
          gsap.from(lines, { yPercent: 115, duration: 1.2, ease: "power4.out", stagger: 0.09, scrollTrigger: at });
        if (rest.length)
          gsap.from(rest, { y: 36, autoAlpha: 0, duration: 1.1, ease: "power3.out", stagger: 0.1, scrollTrigger: at });
        if (!lines.length && !rest.length)
          gsap.from(block, { y: 44, autoAlpha: 0, duration: 1.2, ease: "power3.out", scrollTrigger: at });
      });

      // T meets E exactly as the streams do
      gsap
        .timeline({
          scrollTrigger: {
            trigger: one("[data-confluence]"),
            containerAnimation: travel,
            start: "left 95%",
            end: "left 35%",
            scrub: true,
          },
        })
        .fromTo(q("[data-t]"), { xPercent: -90, yPercent: -18, autoAlpha: 0 }, { xPercent: 0, yPercent: 0, autoAlpha: 1, ease: "power2.out" }, 0)
        .fromTo(q("[data-e]"), { xPercent: 90, yPercent: 18, autoAlpha: 0 }, { xPercent: 0, yPercent: 0, autoAlpha: 1, ease: "power2.out" }, 0)
        .fromTo(q("[data-and]"), { scale: 0, rotate: -50, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.3, ease: "back.out(1.7)" }, 0.7);
    }, root);

    // Opening: hold the first scene until the loader lifts, then let it be drawn in
    const hero = gsap.context(() => {}, root);
    gsap.set(q("[data-hero]"), { autoAlpha: 0 });
    function enter() {
      ScrollTrigger.refresh();
      hero.add(() => {
        gsap.set(q("[data-hero]"), { autoAlpha: 1 });
        const names = SplitText.create(q("[data-name]"), { type: "chars", mask: "chars" });
        gsap
          .timeline({ defaults: { ease: "power4.out" } })
          .fromTo(q("[data-sketch='0']"), { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 2.6, ease: "power2.inOut" }, 0)
          .from(sun, { autoAlpha: 0, scale: 0.6, duration: 2.4 }, 0.2)
          .from(names.chars, { yPercent: 110, duration: 1.4, stagger: 0.035 }, 0.4)
          .from(q("[data-amp]"), { scale: 0.3, rotate: -40, autoAlpha: 0, duration: 1.4 }, 1)
          .from(q("[data-fade]"), { y: 24, autoAlpha: 0, duration: 1.2, stagger: 0.12 }, 1.2);
      });
    }
    if (document.documentElement.dataset.ready) enter();
    else window.addEventListener("site-ready", enter, { once: true });

    // Tabbing to something off-screen brings its part of the world into view
    function onFocus(e: FocusEvent) {
      const block = (e.target as HTMLElement).closest("[data-block]");
      if (!block || !(e.target as HTMLElement).matches(":focus-visible")) return;
      const top = root!.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + Math.max(0, worldLeft(block) - window.innerWidth * 0.2) });
    }
    track.addEventListener("focusin", onFocus);

    return () => {
      window.removeEventListener("site-ready", enter);
      ScrollTrigger.removeEventListener("refreshInit", measure);
      track.removeEventListener("focusin", onFocus);
      hero.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section id="journey" ref={rootRef} className="relative h-[1000vh] motion-reduce:h-auto">
      <div
        data-stage
        className="sticky top-0 h-dvh overflow-hidden bg-paper text-ink motion-reduce:static motion-reduce:h-auto"
      >
        {/* Sun — a wet-on-wet disc that crosses the sky with the reader */}
        <div
          data-sun
          aria-hidden="true"
          className="absolute left-0 top-0 -ml-[8vmin] -mt-[8vmin] h-[16vmin] w-[16vmin] rounded-full motion-reduce:hidden"
          style={{
            background:
              "radial-gradient(circle, var(--sun, #F3D896) 0%, var(--sun, #F3D896) 46%, color-mix(in srgb, var(--sun, #F3D896) 45%, transparent) 60%, transparent 72%)",
            transform: "translate3d(50vw, 14svh, 0)",
          }}
        />

        {/* Far shore: pencil mountains drifting slower than the world */}
        <div
          data-far
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[31%] left-0 top-0 w-[400vw] select-none will-change-transform motion-reduce:hidden"
        >
          <Image
            data-sketch="0"
            src="/illustrations/mountain_close_ink.webp"
            alt=""
            width={1118}
            height={898}
            priority
            className="absolute bottom-0 left-[58vw] h-[46svh] w-auto max-w-none opacity-45 md:left-[44vw] md:h-[62svh]"
          />
          <Image
            src="/illustrations/mountain_ink.webp"
            alt=""
            width={2030}
            height={1329}
            className="absolute bottom-0 left-[44%] h-[54svh] w-auto max-w-none opacity-35"
          />
          <Image
            src="/illustrations/mountain_panorama_ink.webp"
            alt=""
            width={3000}
            height={1278}
            className="absolute bottom-0 right-0 h-[50svh] w-auto max-w-none opacity-40"
          />
        </div>

        <River className="absolute inset-x-0 bottom-0 h-[32%] motion-reduce:hidden" />

        {/* Two paper boats, one to a stream */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 motion-reduce:hidden">
          <div data-boat className="absolute bottom-[-14px] left-[68%] opacity-0 will-change-transform">
            <Boat color="var(--rose)" />
          </div>
          <div data-boat className="absolute bottom-[-14px] left-[60%] opacity-0 will-change-transform">
            <Boat color="var(--indigo)" />
          </div>
        </div>

        {/* The world */}
        <div
          data-track
          className="relative flex h-full w-max will-change-transform motion-reduce:w-full motion-reduce:flex-col"
        >
          {/* The bank they walk on */}
          <div aria-hidden="true" className="bank absolute inset-x-0 bottom-[30%] h-10 motion-reduce:hidden" />

          {/* ── I. The source ── */}
          <div id="hero" data-panel data-hero className="relative h-full w-screen shrink-0 px-[7vw] pt-[15svh] pb-[45svh]">
            <div className="flex h-full max-w-[52rem] flex-col justify-center">
              <p data-fade className="eyebrow text-ink/60">
                {guest ? `Dear ${guest} — t` : "T"}ogether with their families
              </p>
              <h1
                aria-label={`${COUPLE.partner2} and ${COUPLE.partner1}`}
                className="display mt-[2.5svh] select-none text-[min(14.5vw,15.5svh)]"
              >
                <span data-name className="block">{COUPLE.partner2}</span>
                <span className="flex items-baseline gap-[0.14em]">
                  <span data-amp className="block font-script text-[0.8em] leading-none text-gold">&amp;</span>
                  <em data-name className="block">{COUPLE.partner1}</em>
                </span>
              </h1>
              <div data-fade className="mt-[3svh] font-serif text-[clamp(1.1rem,2.7svh,1.6rem)] italic leading-snug text-ink/70">
                {HERO_TAGLINE.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
              <p data-fade className="eyebrow mt-[3svh] text-ink/60">
                {WEDDING.date} · {WEDDING.location}
              </p>
            </div>

            {/* Where the streams rise, and whose they are */}
            <span data-source className="absolute bottom-0 left-[38%]" />
            <span data-fade className="absolute bottom-[28.5%] left-[60%] -rotate-3 font-script text-[clamp(1.5rem,4svh,2.4rem)] text-rose md:left-[50%]">
              {COUPLE.partner1}
            </span>
            <span data-fade className="absolute bottom-[13.5%] left-[52%] rotate-2 font-script text-[clamp(1.5rem,4svh,2.4rem)] text-indigo md:left-[43%]">
              {COUPLE.partner2}
            </span>
            <p data-fade className="eyebrow absolute bottom-[34.5%] right-[5vw] flex items-center gap-3 text-ink/60">
              Scroll to follow the river
              <span aria-hidden="true" className="relative block h-px w-12 overflow-hidden bg-ink/20">
                <span className="absolute inset-0 animate-[cue_2.2s_var(--ease-expo)_infinite] bg-ink" />
              </span>
            </p>
          </div>

          {/* ── II. A note ── */}
          <div id="story" data-panel className="flex h-full shrink-0 gap-[10vw] px-[8vw] pt-[14svh] pb-[45svh] md:gap-[7vw]">
            <div data-block data-reveal className={`${BLOCK} md:w-[30vw] xl:w-[26vw]`}>
              <p data-rise className="eyebrow text-ink/60">
                <span className="text-gold">01</span> — A note
              </p>
              <p data-rise className="display mt-4 text-[clamp(3rem,11svh,6.5rem)]">
                A <em>note</em>
              </p>
            </div>
            {NOTE.map((lines, i) => (
              <div key={i} data-block data-reveal className={BLOCK}>
                <p data-rise className="mb-[2svh] font-serif text-xl italic text-gold">{NUMERALS[i]}.</p>
                <Lines lines={lines} className={POEM} />
              </div>
            ))}
          </div>

          {/* ── III. The blend, and the confluence ── */}
          <div id="gallery" data-panel className="flex h-full shrink-0 gap-[10vw] px-[8vw] pt-[14svh] pb-[45svh] md:gap-[7vw]">
            <div data-block data-reveal className={BLOCK}>
              <p data-rise className="eyebrow text-ink/60">
                <span className="text-gold">02</span> — The blend
              </p>
              <p data-rise className="display mt-4 text-[clamp(2.6rem,9svh,5.5rem)]">
                How I found my <em>cup of tea</em>
              </p>
            </div>
            {BLEND.slice(0, -1).map((lines, i) => (
              <div key={i} data-block data-reveal className={BLOCK}>
                <p data-rise className="mb-[2svh] font-serif text-xl italic text-gold">{NUMERALS[i]}.</p>
                <Lines lines={lines} className={POEM} />
              </div>
            ))}

            <div data-block data-confluence className={`${BLOCK} items-center text-center md:w-[60vw] xl:w-[52vw]`}>
              <p
                aria-label={`${COUPLE.partner1[0]} and ${COUPLE.partner2[0]}`}
                className="display flex items-baseline justify-center text-[min(40vw,30svh)] leading-[0.82]"
              >
                <span data-t className="block text-rose">{COUPLE.partner1[0]}</span>
                <span data-and className="mx-[0.03em] block font-script text-[0.5em] text-gold">&amp;</span>
                <span data-e className="block text-indigo">{COUPLE.partner2[0]}</span>
              </p>
              <div data-reveal className="mt-[2.5svh]">
                <Lines lines={BLEND[BLEND.length - 1]} className="font-serif text-[clamp(1.2rem,3.2svh,2rem)] italic leading-snug" />
                <p data-rise className="eyebrow mt-[2svh] text-ink/60">{BLEND_POEM.closing}</p>
              </div>
            </div>
          </div>

          {/* ── IV. Guwahati ── */}
          <div id="details" data-panel className="flex h-full shrink-0 gap-[10vw] px-[8vw] pt-[14svh] pb-[45svh] md:gap-[6vw]">
            <div data-block data-reveal className={BLOCK}>
              <p data-rise className="eyebrow text-ink/60">
                <span className="text-gold">03</span> — The details
              </p>
              <p data-rise className="display mt-4 text-[clamp(2.8rem,10svh,6rem)]">
                Where <span className="font-script text-[0.75em] text-gold">&amp;</span> <em>when</em>
              </p>
              <div data-rise className="mt-[3svh] flex items-end gap-5">
                <span className="display text-[clamp(4.5rem,17svh,9.5rem)] leading-[0.8] text-gold">{day}</span>
                <div className="pb-1">
                  <p className="font-serif text-[clamp(1.5rem,4svh,2.4rem)] italic">
                    {month} {year}
                  </p>
                  <p className="eyebrow mt-1.5 text-ink/60">
                    {WEDDING.dayOfWeek} · {WEDDING.time}
                  </p>
                </div>
              </div>
            </div>

            <Postcard index="i." type="Ceremony" venue={VENUE.ceremony} />
            <Postcard index="ii." type="Reception" venue={VENUE.reception} />

            <div data-block data-reveal className={BLOCK}>
              <p data-rise className="eyebrow mb-[3svh] text-ink/60">On the day</p>
              <div className="relative flex flex-col gap-[3svh] border-l border-gold/60 pl-7">
                {ON_THE_DAY.map((item) => (
                  <div key={item.time} data-rise className="relative">
                    <span className="absolute -left-[33px] top-2 h-[11px] w-[11px] rounded-full border border-gold bg-paper-2" />
                    <p className="eyebrow text-gold">{item.time}</p>
                    <p className="display mt-1 text-[clamp(1.7rem,5svh,2.8rem)]">{item.event}</p>
                  </div>
                ))}
              </div>
              <p data-rise className="mt-[3svh] max-w-md whitespace-pre-line font-serif text-[clamp(1.05rem,2.6svh,1.35rem)] italic leading-relaxed text-ink/70">
                {ON_THE_DAY_NOTE[0]}
              </p>
            </div>

            <div data-block data-reveal className={BLOCK}>
              {ON_THE_DAY_NOTE.slice(1).map((para) => (
                <p key={para} data-rise className="mb-[2.5svh] max-w-md whitespace-pre-line font-serif text-[clamp(1.15rem,3svh,1.6rem)] italic leading-relaxed text-ink/75">
                  {para}
                </p>
              ))}
            </div>

            <div data-block data-reveal className={BLOCK}>
              <p data-rise className="eyebrow mb-[2svh] text-ink/60">Getting there</p>
              {TRAVEL.map((item) => (
                <div key={item.label} data-rise className="group flex gap-5 border-t border-ink/15 py-[2.2svh] last:border-b">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-ink/20 text-ink/70 transition-all duration-500 ease-expo group-hover:-rotate-12 group-hover:border-gold group-hover:text-gold">
                    {item.icon === "train" ? <Train size={17} strokeWidth={1.25} /> : <Plane size={17} strokeWidth={1.25} />}
                  </span>
                  <div>
                    <p className="eyebrow text-ink/55">{item.label}</p>
                    <p className="mt-1 font-serif text-[clamp(1.15rem,3svh,1.5rem)] leading-snug">{item.value}</p>
                    <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink/60">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── V. Save the date, then the far shore ── */}
          <div data-panel-end className="flex h-full shrink-0 items-start gap-[10vw] px-[8vw] pt-[14svh] pb-[45svh] md:gap-[7vw]">
            <div data-block data-reveal className={`${BLOCK} items-center md:w-auto xl:w-auto`}>
              <div className="pointer-events-none w-[min(84vw,64svh)] select-none overflow-hidden rounded-[1.75rem] shadow-[0_24px_50px_-30px_rgb(43_38_34/0.5)]">
                <ChromakeyVideo
                  mp4Src="/illustrations/save_the_date.mp4"
                  mobileSrc="/illustrations/save_the_date_mobile.mp4"
                  keyColor={[94, 159, 109]}
                  hueTolerance={40}
                  satMin={0.25}
                  className="h-auto w-full"
                />
              </div>
            </div>
            <div data-block data-reveal className={`${BLOCK} md:w-[52vw] xl:w-[44vw]`}>
              <Lines
                lines={["In the land of rivers and tea,", "our story finds its moment."]}
                className="display text-[clamp(1.8rem,6.4svh,4.2rem)] italic leading-[1.1]"
              />
              <p data-rise className="eyebrow mt-[4svh] flex items-center gap-3 text-ink/60">
                The far shore
                <span aria-hidden="true" className="block h-8 w-px bg-ink/30" />
                Keep scrolling
              </p>
            </div>
          </div>
        </div>

        {/* The couple walk the bank; the film only advances while you scroll */}
        <div
          data-couple
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[27.5%] left-[1vw] w-[clamp(190px,23vw,360px)] select-none will-change-transform motion-reduce:hidden md:left-[5vw]"
          style={{ transform: "translate3d(-110%, 0, 0)" }}
        >
          <div data-couple-face style={{ transform: "scaleX(-1)" }}>
            <ChromakeyVideo
              mp4Src="/illustrations/Green_clear_background_202604212207.mp4"
              mobileSrc="/illustrations/Green_clear_background_202604212207_mobile.mp4"
              keyColor={[97, 133, 86]}
              walkOnScroll
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
