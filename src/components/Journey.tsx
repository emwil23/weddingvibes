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
import { dive, journey, paperAt, smoothstep, worldToScroll } from "@/lib/journey";
import ChromakeyVideo from "@/components/ChromakeyVideo";
import River, { streamY } from "@/components/River";
import Water from "@/components/Water";
import { reducedMotion } from "@/components/Motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

// ─── The journey ─────────────────────────────────────────────────────────────
// One long scroll-painting. The page scrolls down; the world travels sideways:
// from the mountains where two streams rise, past the note, to the confluence.
// There the world stops and the river rises over the page, where the two colours
// steep into one while the blend poem is read. Then the water falls back and it travels on to
// Guwahati. The sun crosses the sky as you go and the paper warms to dusk.

const RIVER_BAND = 0.32; // share of the stage the river occupies — keep in step with the classes below
const FAR_SPEED = 0.3; // the mountains drift at this fraction of the world's speed
const DIVE_SCREENS = 5; // how many screens of scroll the dive lasts

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
// Underwater, each verse takes the whole screen in turn. Their hidden starting states live in CSS
// (not in gsap "from" values), so no refresh or revert can ever leave two verses showing at once.
const LAYER =
  "invisible absolute inset-0 flex flex-col items-center justify-center px-[8vw] text-center opacity-0 motion-reduce:visible motion-reduce:static motion-reduce:py-10 motion-reduce:opacity-100";
const SUNK = "[transform:translateY(115%)] motion-reduce:[transform:none]";
const UNSEEN = "opacity-0 motion-reduce:opacity-100 motion-reduce:[transform:none]";

// Lines that rise out of a mask when their block drifts into view
// `sunk` starts them below the mask in CSS, for tweens that only ever animate *to* the resting state
function Lines({ lines, className, sunk }: { lines: string[]; className?: string; sunk?: boolean }) {
  return (
    <p className={className}>
      {lines.map((line) => (
        <span key={line} className="block overflow-hidden py-[0.06em]">
          <span data-line className={`block ${sunk ? SUNK : ""}`}>{line}</span>
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

    const water = one("[data-water]");
    const bank = one("[data-bank]");
    const reveals: { block: HTMLElement; play: gsap.core.Timeline; left: number; done: boolean }[] = [];

    const distance = () => track.scrollWidth - window.innerWidth;
    const worldLeft = (el: Element) => el.getBoundingClientRect().left - track.getBoundingClientRect().left;

    // The section is as tall as the journey is long: 1px of scroll moves the world 1px
    function measure() {
      journey.hold = window.innerHeight * DIVE_SCREENS;
      journey.holdAt = worldLeft(one("[data-confluence]"));
      root!.style.height = `${distance() + journey.hold + window.innerHeight}px`;
      far.style.width = `${window.innerWidth + distance() * FAR_SPEED}px`;
      journey.sourceX = worldLeft(one("[data-source]"));
      journey.confluenceX = journey.holdAt + window.innerWidth * 0.5;
      reveals.forEach((r) => (r.left = worldLeft(r.block)));
    }
    measure();
    ScrollTrigger.addEventListener("refreshInit", measure);

    const ctx = gsap.context(() => {
      const setFar = gsap.quickSetter(far, "x", "px");
      const setX = gsap.quickSetter(track, "x", "px");
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

        // Blocks come alive as the world carries them into view
        for (const r of reveals) {
          if (r.done || r.left > x + window.innerWidth * 0.84) continue;
          r.done = true;
          r.play.play();
        }

        // Tell the nav which chapter is under the reader
        const centre = x + window.innerWidth * 0.45;
        const here = panels.filter((el) => el.offsetLeft <= centre).pop()?.id ?? panels[0].id;
        if (here !== chapter) {
          chapter = here;
          window.dispatchEvent(new CustomEvent("chapter", { detail: here }));
        }
      }

      // ── The dive: 10 units long, played by the scroll while the world holds still ──
      const pool = { cover: 0 };
      function clip() {
        // The river swells: its waterline climbs from the bottom edge until the screen is under
        dive.level = pool.cover * 1.2 - 0.1;
        dive.on = pool.cover > 0.001;
        dive.under = pool.cover > 0.999;
        water.style.visibility = dive.on ? "visible" : "hidden";
        bank.style.opacity = String(1 - smoothstep(0.2, 0.32, dive.level));
        // The fixed chips turn pale once the water has reached them (see globals.css)
        document.documentElement.toggleAttribute("data-under", dive.level > 0.97);
      }
      // Every element gets one tween per property: scrubbing back and forth must never leave two fighting.
      // Layers fade in on the outer element and out on the inner one; the waterline is worked out in update().
      const diving = gsap.timeline({ paused: true, defaults: { ease: "none" } });
      const show = (el: Element, at: number, until: number) =>
        diving
          .to(el, { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, at)
          .to(el.firstElementChild, { autoAlpha: 0, y: -36, duration: 0.3, ease: "power2.in" }, until - 0.3);
      const rise = (lines: ArrayLike<Element>, at: number) =>
        diving.to(lines, { y: 0, duration: 0.45, ease: "power3.out", stagger: 0.07 }, at);
      const verses = q("[data-verse]");
      const last = verses[verses.length - 1];

      show(verses[0], 1.15, 2.6);
      verses.slice(1, -1).forEach((verse, i) => {
        show(verse, 2.6 + i * 1.2, 3.8 + i * 1.2);
        rise(verse.querySelectorAll("[data-line]"), 2.6 + i * 1.2);
      });
      show(last, 7.4, 9.2);
      rise(last.querySelectorAll("[data-line]"), 8.05);
      diving
        .to(dive, { mix: 1, duration: 5 }, 2.6) // the two colours steep into one as the verses pass
        .to(q("[data-t], [data-e]"), { x: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 7.4)
        .to(q("[data-and]"), { scale: 1, autoAlpha: 1, duration: 0.35, ease: "back.out(1.7)" }, 8)
        .to(last.querySelectorAll("[data-rise]"), { autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 8.35)
        .set({}, {}, 10);
      const goUnder = gsap.parseEase("power1.inOut");
      const comeUp = gsap.parseEase("power1.inOut");
      clip();

      // Blocks rise once, when paint() sees them arrive
      (q("[data-reveal]") as HTMLElement[]).forEach((block) => {
        const play = gsap.timeline({ paused: true });
        const lines = block.querySelectorAll("[data-line]");
        const rest = block.querySelectorAll("[data-rise]");
        if (lines.length) play.from(lines, { yPercent: 115, duration: 1.2, ease: "power4.out", stagger: 0.09 }, 0);
        if (rest.length) play.from(rest, { y: 36, autoAlpha: 0, duration: 1.1, ease: "power3.out", stagger: 0.1 }, 0);
        if (!lines.length && !rest.length) play.from(block, { y: 44, autoAlpha: 0, duration: 1.2, ease: "power3.out" }, 0);
        reveals.push({ block, play, left: worldLeft(block), done: false });
      });

      // Scroll px map to world px one to one, except at the confluence, where the world waits for the dive
      const pos = { s: 0 };
      function update() {
        const over = pos.s - journey.holdAt;
        const x = over <= 0 ? pos.s : over < journey.hold ? journey.holdAt : pos.s - journey.hold;
        setX(-x);
        const d = gsap.utils.clamp(0, 1, over / journey.hold) * 10;
        diving.time(d);
        // …rising through the first screen and a bit, and draining back into the river at the end
        pool.cover = goUnder(gsap.utils.clamp(0, 1, d / 1.3)) * (1 - comeUp(gsap.utils.clamp(0, 1, (d - 9.2) / 0.8)));
        clip();
        paint(x, x / distance());
      }
      gsap.to(pos, {
        s: () => distance() + journey.hold,
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 1, // the world eases after the scroll instead of snapping to it
          invalidateOnRefresh: true,
          // The film has them facing left, so it is mirrored to walk downstream; scrolling back turns them around
          onUpdate: (self) => gsap.to(one("[data-couple-face]"), { scaleX: -self.direction, duration: 0.5, overwrite: true }),
          onRefresh: update,
        },
        onUpdate: update,
      });
      update();

      // Past the journey's end the page turns downward into the reply
      ScrollTrigger.create({
        trigger: document.getElementById("rsvp"),
        start: "top 55%",
        onEnter: () => window.dispatchEvent(new CustomEvent("chapter", { detail: "rsvp" })),
        onLeaveBack: () => window.dispatchEvent(new CustomEvent("chapter", { detail: chapter })),
      });
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
      window.scrollTo({ top: top + worldToScroll(Math.max(0, worldLeft(block) - window.innerWidth * 0.2)) });
    }
    track.addEventListener("focusin", onFocus);

    return () => {
      window.removeEventListener("site-ready", enter);
      ScrollTrigger.removeEventListener("refreshInit", measure);
      track.removeEventListener("focusin", onFocus);
      hero.revert();
      ctx.revert();
      document.documentElement.removeAttribute("data-under");
      dive.on = dive.under = false;
      dive.mix = 0;
      dive.level = -0.1;
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

        {/* Far shore: pencil mountains drifting slower than the world. Two of the scans are cropped
            mid-drawing, so those edges are masked to trail off into the paper. */}
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
            className="absolute bottom-0 left-[58vw] h-[46svh] w-auto max-w-none opacity-45 md:left-[44vw] md:h-[62svh] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,#000_26%),linear-gradient(to_top,transparent,#000_14%)]"
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
            className="absolute bottom-0 right-0 h-[50svh] w-auto max-w-none opacity-40 [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_86%,transparent)]"
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

        {/* The river, risen over the page: Tina's rose and Emmanuel's indigo, then one colour */}
        <Water
          data-water
          state={dive}
          colors={["#B5566A", "#34558A", "#5B6AA6", "#3E4C86"]}
          shallow={["#CC7866", "#4A6BA1", "#738CB8"]}
          className="invisible absolute inset-0 motion-reduce:hidden"
        />

        {/* The world */}
        <div
          data-track
          className="relative flex h-full w-max will-change-transform motion-reduce:w-full motion-reduce:flex-col"
        >
          {/* The bank they walk on */}
          <div data-bank aria-hidden="true" className="bank absolute inset-x-0 bottom-[30%] h-10 motion-reduce:hidden" />

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

          {/* ── III. The confluence: the world waits here while the page goes under ── */}
          <div
            id="gallery"
            data-panel
            data-confluence
            className="relative h-full w-screen shrink-0 text-paper-2 motion-reduce:h-auto motion-reduce:w-full motion-reduce:text-ink"
          >
            <div data-verse className={LAYER}>
              <div>
                <p className="eyebrow opacity-75">
                  <span className="text-[#EBCB8B] motion-reduce:text-gold">02</span> — The blend
                </p>
                <p className="display mt-4 text-[clamp(2.4rem,min(10svh,13vw),6.5rem)]">
                  How I found my <em>cup of tea</em>
                </p>
              </div>
            </div>
            {BLEND.slice(0, -1).map((lines, i) => (
              <div key={i} data-verse className={LAYER}>
                <div>
                  <p className="mb-[2.5svh] font-serif text-xl italic text-[#EBCB8B] motion-reduce:text-gold">{NUMERALS[i]}.</p>
                  <Lines sunk lines={lines} className="display text-[clamp(1.35rem,min(5.4svh,6vw),3.6rem)] leading-[1.2]" />
                </div>
              </div>
            ))}
            <div data-verse className={LAYER}>
              <div>
                <p
                  aria-label={`${COUPLE.partner1[0]} and ${COUPLE.partner2[0]}`}
                  className="display flex items-baseline justify-center text-[min(40vw,34svh)] leading-[0.82]"
                >
                  <span data-t className={`block [transform:translateX(-120%)] ${UNSEEN}`}>{COUPLE.partner1[0]}</span>
                  <span data-and className={`mx-[0.03em] block font-script text-[0.5em] text-[#EBCB8B] [transform:scale(0.2)] motion-reduce:text-gold ${UNSEEN}`}>&amp;</span>
                  <span data-e className={`block [transform:translateX(120%)] ${UNSEEN}`}>{COUPLE.partner2[0]}</span>
                </p>
                <Lines sunk lines={BLEND[BLEND.length - 1]} className="mt-[3svh] font-serif text-[clamp(1.2rem,3.4svh,2.1rem)] italic leading-snug" />
                <p data-rise className={`eyebrow mt-[2.5svh] ${UNSEEN}`}>{BLEND_POEM.closing}</p>
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

      </div>
    </section>
  );
}
