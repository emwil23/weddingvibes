"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MapPin, Plane, Train } from "lucide-react";
import { VENUE, TRAVEL, ON_THE_DAY, ON_THE_DAY_NOTE } from "@/lib/constants";
import { staggerContainer, staggerItem, fadeUp, VIEWPORT } from "@/hooks/useScrollAnimation";

function VenueCard({
  type,
  venue,
}: {
  type: "Ceremony" | "Reception";
  venue: { name: string; address: string; city: string; time: string; description: string };
}) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col">
      <p className="font-body text-[10px] tracking-[0.3em] uppercase text-charcoal/40 dark:text-cream/35 mb-6">
        {type}
      </p>
      <h3
        className="font-display text-charcoal dark:text-cream mb-4"
        style={{ fontSize: "clamp(1.6rem, 3.5vw, 3rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
      >
        {venue.name}
      </h3>
      <div className="w-8 h-px bg-charcoal/20 dark:bg-cream/20 mb-5" />
      <div className="flex flex-col gap-1 mb-6">
        <p className="font-body text-sm text-charcoal/60 dark:text-cream/50">{venue.address}</p>
        {venue.city && <p className="font-body text-sm text-charcoal/60 dark:text-cream/50">{venue.city}</p>}
        <p className="font-body text-sm text-charcoal/40 dark:text-cream/35 mt-2 tracking-wide">{venue.time}</p>
      </div>
      <p className="font-body text-sm text-charcoal/45 dark:text-cream/40 leading-relaxed max-w-xs">
        {venue.description}
      </p>
      <a
        href={`https://maps.google.com/?q=${encodeURIComponent(venue.name + " " + venue.address)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 font-body text-[10px] tracking-[0.2em] uppercase text-charcoal/40 dark:text-cream/35 hover:text-charcoal dark:hover:text-cream transition-colors duration-300 border-b border-charcoal/15 dark:border-cream/15 pb-1 self-start hover:border-charcoal/40 dark:hover:border-cream/40"
      >
        <MapPin size={10} />
        View on map
      </a>
    </motion.div>
  );
}

export default function Location() {
  return (
    <section
      id="details"
      className="relative py-32 md:py-48 bg-cream dark:bg-charcoal overflow-hidden"
    >
      {/* Mountain background — blended into section */}
      <div
        className="absolute inset-0 z-0 pointer-events-none select-none"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)",
          maskComposite: "intersect",
          WebkitMaskComposite: "destination-in",
        }}
      >
        <Image
          src="/illustrations/mountain_1x.webp"
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 100vw"
          className="object-cover opacity-[0.12] dark:opacity-[0.07]"
          draggable={false}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-8 md:px-20 lg:px-32">

        {/* Section heading */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="mb-20 md:mb-28"
        >
          <p className="font-body text-[10px] tracking-[0.3em] uppercase text-charcoal/40 dark:text-cream/35 mb-4">
            The details
          </p>
          <h2
            className="font-display text-charcoal dark:text-cream"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.95 }}
          >
            Where &amp; When
          </h2>
        </motion.div>

        {/* Venue cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="grid md:grid-cols-2 gap-16 md:gap-24 mb-24 md:mb-32"
        >
          <VenueCard type="Ceremony" venue={VENUE.ceremony} />
          <div className="hidden md:block absolute left-1/2 -translate-x-1/2 h-64 w-px bg-charcoal/8 dark:bg-cream/8" />
          <VenueCard type="Reception" venue={VENUE.reception} />
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          style={{ transformOrigin: "left center" }}
          className="w-full h-px bg-charcoal/10 dark:bg-cream/10 mb-20 md:mb-24"
        />

        {/* Travel */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="mb-20 md:mb-28"
        >
          <motion.p
            variants={staggerItem}
            className="font-body text-[10px] tracking-[0.3em] uppercase text-charcoal/40 dark:text-cream/35 mb-12"
          >
            Getting there
          </motion.p>
          <div className="flex flex-col gap-8">
            {TRAVEL.map((item) => (
              <motion.div key={item.label} variants={staggerItem}>
                <div className="flex items-center gap-3 mb-3 text-charcoal/40 dark:text-cream/35">
                  {item.icon === "train" ? <Train size={14} strokeWidth={1.5} /> : <Plane size={14} strokeWidth={1.5} />}
                  <span className="font-body text-[10px] tracking-[0.2em] uppercase">{item.label}</span>
                </div>
                <p
                  className="font-body text-charcoal dark:text-cream mb-1"
                  style={{ fontSize: "clamp(1rem, 2vw, 1.3rem)", letterSpacing: "-0.01em" }}
                >
                  {item.value}
                </p>
                <p className="font-body text-sm text-charcoal/45 dark:text-cream/40 max-w-sm leading-relaxed">
                  {item.detail}
                </p>
              </motion.div>
            ))}
          </div>

        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          style={{ transformOrigin: "left center" }}
          className="w-full h-px bg-charcoal/10 dark:bg-cream/10 mb-20 md:mb-24"
        />

        {/* On The Day */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
        >
          <motion.p
            variants={staggerItem}
            className="font-body text-[10px] tracking-[0.3em] uppercase text-charcoal/40 dark:text-cream/35 mb-12"
          >
            On the day
          </motion.p>
          <div className="flex flex-col gap-4 mb-10">
            {ON_THE_DAY.map((item) => (
              <motion.div key={item.time} variants={staggerItem} className="flex items-baseline gap-6">
                <span className="font-body text-sm text-charcoal/40 dark:text-cream/35 w-20 shrink-0">
                  {item.time}
                </span>
                <span
                  className="font-body text-charcoal dark:text-cream"
                  style={{ fontSize: "clamp(1rem, 1.8vw, 1.2rem)" }}
                >
                  {item.event}
                </span>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-col gap-5 mt-2">
            {ON_THE_DAY_NOTE.map((para, i) => (
              <motion.p
                key={i}
                variants={staggerItem}
                className="font-body text-sm text-charcoal/50 dark:text-cream/40 leading-loose max-w-sm whitespace-pre-line"
              >
                {para}
              </motion.p>
            ))}
          </div>
        </motion.div>

        {/* Save the date animation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="flex items-center justify-center mt-16 md:mt-24 pointer-events-none select-none"
        >
          <div className="w-full md:w-2/3 rounded-3xl overflow-hidden">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto"
            >
              <source src="/illustrations/save_the_date_keyed.webm" type="video/webm" />
              <source src="/illustrations/save_the_date.mp4" type="video/mp4" />
            </video>
          </div>
        </motion.div>

        {/* Closing quote */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={VIEWPORT}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          style={{ transformOrigin: "left center" }}
          className="w-full h-px bg-charcoal/10 dark:bg-cream/10 mt-20 md:mt-24 mb-16 md:mb-20"
        />
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="font-display text-charcoal/25 dark:text-cream/20 text-center"
          style={{ fontSize: "clamp(2rem, 4.5vw, 1rem)", letterSpacing: "-0.01em" }}
        >
          In the land of rivers and tea, our story finds its moment.
        </motion.p>

        </div>
    </section>
  );
}
