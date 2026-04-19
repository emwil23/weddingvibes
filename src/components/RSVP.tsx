"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, staggerContainer, staggerItem, VIEWPORT } from "@/hooks/useScrollAnimation";
import { COUPLE, WEDDING } from "@/lib/constants";

type Attendance = "yes" | "no" | null;

export default function RSVP() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attendance, setAttendance] = useState<Attendance>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !attendance) return;
    setLoading(true);
    // Replace this with your form submission logic (Formspree, Airtable, etc.)
    await new Promise((r) => setTimeout(r, 1000));
    console.log({ name, email, attendance, message });
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section
      id="rsvp"
      className="relative py-32 md:py-48 bg-cream-dark dark:bg-charcoal-light overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-8 md:px-20 lg:px-32">
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-start">

          {/* Left: text block */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <motion.p
              variants={staggerItem}
              className="font-body text-[10px] tracking-[0.3em] uppercase text-charcoal/40 dark:text-cream/35 mb-4"
            >
              Kindly respond by July 1, 2026
            </motion.p>
            <motion.h2
              variants={staggerItem}
              className="font-display text-charcoal dark:text-cream mb-8"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
                letterSpacing: "0.01em",
                lineHeight: 1.2,
              }}
            >
              Will you
              <br />
              join us?
            </motion.h2>
            <motion.p
              variants={staggerItem}
              className="font-body text-sm text-charcoal/55 dark:text-cream/45 leading-relaxed max-w-sm"
            >
              We would be honoured to celebrate with you in Guwahati.
              <br />
              Please let us know if you can make it.
            </motion.p>

            {/* Decorative date */}
            <motion.div
              variants={staggerItem}
              className="mt-16 pt-8 border-t border-charcoal/10 dark:border-cream/10"
            >
              <p className="font-body text-charcoal/20 dark:text-cream/15"
                style={{ fontSize: "clamp(1rem, 3vw, 2rem)", letterSpacing: "-0.01em" }}
              >
                {WEDDING.date}
              </p>
            </motion.div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={VIEWPORT}
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-10"
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Name */}
                  <div>
                    <label className="block font-body text-[10px] tracking-[0.2em] uppercase text-charcoal/40 dark:text-cream/35 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="input-minimal"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-body text-[10px] tracking-[0.2em] uppercase text-charcoal/40 dark:text-cream/35 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="input-minimal"
                    />
                  </div>

                  {/* Attendance */}
                  <div>
                    <label className="block font-body text-[10px] tracking-[0.2em] uppercase text-charcoal/40 dark:text-cream/35 mb-5">
                      Attendance *
                    </label>
                    <div className="flex gap-4">
                      {(["yes", "no"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setAttendance(opt)}
                          className={`flex-1 py-3 border text-xs tracking-[0.15em] uppercase font-body transition-all duration-400 ${
                            attendance === opt
                              ? "border-charcoal dark:border-cream bg-charcoal dark:bg-cream text-cream dark:text-charcoal"
                              : "border-charcoal/20 dark:border-cream/20 text-charcoal/50 dark:text-cream/50 hover:border-charcoal/50 dark:hover:border-cream/50"
                          }`}
                        >
                          {opt === "yes"
                            ? "Joyfully accepts"
                            : "Regretfully declines"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block font-body text-[10px] tracking-[0.2em] uppercase text-charcoal/40 dark:text-cream/35 mb-2">
                      Message
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="A note for the couple (optional)"
                      className="input-minimal resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading || !name || !attendance}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="relative mt-2 w-full py-4 border border-charcoal dark:border-cream text-charcoal dark:text-cream font-body text-xs tracking-[0.2em] uppercase transition-all duration-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-charcoal hover:text-cream dark:hover:bg-cream dark:hover:text-charcoal"
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      "Send RSVP"
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  className="flex flex-col gap-6 pt-8"
                >
                  <p className="font-body text-[10px] tracking-[0.3em] uppercase text-charcoal/40 dark:text-cream/35">
                    Thank you
                  </p>
                  <h3
                    className="font-body text-charcoal dark:text-cream"
                    style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
                  >
                    We can&apos;t wait
                    <br />
                    to see you.
                  </h3>
                  <p className="font-body text-sm text-charcoal/55 dark:text-cream/45 leading-relaxed">
                    {name}, your RSVP has been received.
                    <br />
                    {COUPLE.fullNames} ✦
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
