"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChromakeyVideo from "@/components/ChromakeyVideo";
import { COUPLE, WEDDING } from "@/lib/constants";

type Attendance = "yes" | "no" | null;

interface Errors {
  name?: string;
  email?: string;
  attendance?: string;
  form?: string;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RSVP() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [attendance, setAttendance] = useState<Attendance>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!email.trim()) e.email = "Email is required.";
    else if (!isValidEmail(email)) e.email = "Please enter a valid email.";
    if (!attendance) e.attendance = "Please let us know if you can attend.";
    return e;
  }

  function onBlur(field: string) {
    setTouched((t) => ({ ...t, [field]: true }));
    const e = validate();
    setErrors(e);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched = { name: true, email: true, attendance: true };
    setTouched(allTouched);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, attendance, message, _hp: "" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error ?? "Something went wrong. Please try again." });
        setLoading(false);
        return;
      }
    } catch {
      setErrors({ form: "Network error. Please check your connection and try again." });
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section
      id="rsvp"
      className="relative py-32 md:py-48 bg-cream dark:bg-charcoal overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-8 md:px-20 lg:px-32">
        <div className="grid lg:grid-cols-2 gap-20 lg:gap-32 items-start">

          {/* Left: text block */}
          <div>
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-charcoal/40 dark:text-cream/35 mb-4">
              Kindly respond by July 1, 2026
            </p>
            <h2
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
            </h2>
            <p className="font-body text-sm text-charcoal/55 dark:text-cream/45 leading-relaxed max-w-sm">
              We would be honoured to celebrate with you in Guwahati.
              <br />
              Please let us know if you can make it.
            </p>

            {/* Couple video */}
            <div className="mt-10">
              <ChromakeyVideo
                mp4Src="/illustrations/rsvp.mp4"
                keyColor={[77, 158, 99]}
                hueTolerance={35}
                satMin={0.2}
                className="w-full h-auto"
              />
            </div>

            {/* Decorative date */}
            <div className="mt-8 pt-8 border-t border-charcoal/10 dark:border-cream/10">
              <p className="font-body text-charcoal/20 dark:text-cream/15"
                style={{ fontSize: "clamp(1rem, 3vw, 2rem)", letterSpacing: "-0.01em" }}
              >
                {WEDDING.date}
              </p>
            </div>
          </div>

          {/* Right: form */}
          <div
            className="relative z-10 backdrop-blur-md bg-cream/70 dark:bg-charcoal/70 p-8 md:p-12 rounded-3xl  dark:border-cream/10"
          >
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  noValidate
                  className="flex flex-col gap-10"
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Hidden honeypot — not shown to humans */}
                  <input type="text" name="_hp" tabIndex={-1} className="hidden" aria-hidden="true" />

                  {/* Name */}
                  <div>
                    <label className="block font-body text-[10px] tracking-[0.2em] uppercase text-charcoal/40 dark:text-cream/35 mb-2">
                      Full Name <span className="text-charcoal/30 dark:text-cream/25">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (touched.name) setErrors((err) => ({ ...err, name: e.target.value.trim() ? undefined : "Name is required." })); }}
                      onBlur={() => onBlur("name")}
                      placeholder="Your name"
                      className={`input-minimal ${touched.name && errors.name ? "border-red-400 dark:border-red-400" : ""}`}
                    />
                    <FieldError show={!!(touched.name && errors.name)} message={errors.name} />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block font-body text-[10px] tracking-[0.2em] uppercase text-charcoal/40 dark:text-cream/35 mb-2">
                      Email <span className="text-charcoal/30 dark:text-cream/25">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (touched.email) {
                          const v = e.target.value;
                          setErrors((err) => ({ ...err, email: !v.trim() ? "Email is required." : !isValidEmail(v) ? "Please enter a valid email." : undefined }));
                        }
                      }}
                      onBlur={() => onBlur("email")}
                      placeholder="your@email.com"
                      className={`input-minimal ${touched.email && errors.email ? "border-red-400 dark:border-red-400" : ""}`}
                    />
                    <FieldError show={!!(touched.email && errors.email)} message={errors.email} />
                  </div>

                  {/* Attendance */}
                  <div>
                    <label className="block font-body text-[10px] tracking-[0.2em] uppercase text-charcoal/40 dark:text-cream/35 mb-5">
                      Attendance <span className="text-charcoal/30 dark:text-cream/25">*</span>
                    </label>
                    <div className="flex gap-4">
                      {(["yes", "no"] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setAttendance(opt);
                            setErrors((err) => ({ ...err, attendance: undefined }));
                            setTouched((t) => ({ ...t, attendance: true }));
                          }}
                          className={`flex-1 py-3 border text-xs tracking-[0.15em] uppercase font-body transition-all duration-300 ${
                            touched.attendance && errors.attendance && !attendance
                              ? "border-red-400 dark:border-red-400 text-charcoal/50 dark:text-cream/50"
                              : "border-charcoal/20 dark:border-cream/20 text-charcoal/50 dark:text-cream/50 hover:border-charcoal/50 dark:hover:border-cream/50"
                          } ${
                            attendance === opt
                              ? opt === "yes"
                                ? "bg-green-50 dark:bg-green-950/40"
                                : "bg-rose-50 dark:bg-rose-950/40"
                              : ""
                          }`}
                        >
                          {opt === "yes" ? "Joyfully accepts" : "Regretfully declines"}
                        </button>
                      ))}
                    </div>
                    <FieldError show={!!(touched.attendance && errors.attendance)} message={errors.attendance} />
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

                  {/* Form-level error */}
                  <AnimatePresence>
                    {errors.form && (
                      <motion.p
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="font-body text-xs text-red-500 dark:text-red-400 -mt-4"
                      >
                        {errors.form}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={loading}
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
                  {attendance === "yes" ? (
                    <>
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
                        {COUPLE.fullNames} 🖤
                      </p>
                    </>
                  ) : (
                    <>
                      <h3
                        className="font-body text-charcoal dark:text-cream"
                        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", letterSpacing: "-0.02em", lineHeight: 1 }}
                      >
                        You will be
                        <br />
                        missed.
                      </h3>
                      <p className="font-body text-sm text-charcoal/55 dark:text-cream/45 leading-relaxed">
                        {name}, we&apos;re sorry you can&apos;t make it.
                        <br />
                        We&apos;ll be thinking of you. {COUPLE.fullNames} 🖤
                      </p>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function FieldError({ show, message }: { show: boolean; message?: string }) {
  return (
    <AnimatePresence>
      {show && message && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 font-body text-xs text-red-500 dark:text-red-400"
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
