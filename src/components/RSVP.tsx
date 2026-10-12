"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChromakeyVideo from "@/components/ChromakeyVideo";
import { useGsapReveal } from "@/hooks/useGsapReveal";
import { COUPLE, WEDDING } from "@/lib/constants";
import { SplitHeading } from "@/components/Motion";

type Attendance = "yes" | "no" | null;

interface Errors {
  name?: string;
  attendance?: string;
  form?: string;
}


export default function RSVP() {
  const [name, setName] = useState("");
  const [attendance, setAttendance] = useState<Attendance>(null);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const eyebrowRef = useGsapReveal<HTMLParagraphElement>({ type: "fadeIn" });
  const leftRef = useGsapReveal({ stagger: 0.14 });
  const formRef = useGsapReveal({ type: "fadeUp" });

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = "Name is required.";
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
    const allTouched = { name: true, attendance: true };
    setTouched(allTouched);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Honeypot — bots fill hidden fields, humans don't; silently drop
      const hp = new FormData(e.currentTarget as HTMLFormElement).get("_hp");
      if (!hp && process.env.NEXT_PUBLIC_SCRIPT_URL) {
        // shortcut: no-cors hides the Apps Script response, so only network failures surface; upgrade if the script must return errors
        await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          body: new URLSearchParams({ name, email: "", attendance: attendance!, message }),
        });
      }
    } catch {
      setErrors({ form: "Network error. Please check your connection and try again." });
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  };

  const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const nameInvalid = !!(touched.name && errors.name);
  const attendanceInvalid = !!(touched.attendance && errors.attendance);

  return (
    <section id="rsvp" className="relative pt-24 pb-28 text-ink [--gold:#8A6430] md:pt-36 md:pb-40">

      <div className="relative z-10 mx-auto grid max-w-7xl items-start gap-14 px-6 md:px-10 lg:grid-cols-12 lg:gap-10">
        {/* Left: invitation */}
        <div className="lg:col-span-6">
          <p ref={eyebrowRef} className="eyebrow mb-6 text-ink/50">
            <span className="text-gold">04</span> — Kindly respond by {WEDDING.rsvpDeadline}
          </p>
          <SplitHeading className="display text-[clamp(3.4rem,9vw,8rem)]">
            Will you
            <br />
            <em>join us?</em>
          </SplitHeading>

          <div ref={leftRef}>
            <p className="mt-8 max-w-md font-serif text-2xl italic leading-snug text-ink/65">
              We would be honoured to celebrate with you in Guwahati. Please let us know if you can make it.
            </p>
            <div className="pointer-events-none mt-8 max-w-lg select-none">
              <ChromakeyVideo
                mp4Src="/illustrations/rsvp.mp4"
                mobileSrc="/illustrations/rsvp_mobile.mp4"
                keyColor={[77, 158, 99]}
                hueTolerance={35}
                satMin={0.2}
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>

        {/* Right: reply card */}
        <div
          ref={formRef}
          className="relative rounded-[2rem] border border-ink/10 bg-paper-2 p-7 shadow-[0_40px_80px_-40px_rgb(43_38_34/0.5)] md:p-12 lg:col-span-5 lg:col-start-8 lg:mt-24"
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
                <input type="text" name="_hp" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                <div>
                  <label htmlFor="rsvp-name" className="eyebrow block text-ink/50">
                    Full name <span className="text-gold">*</span>
                  </label>
                  <input
                    id="rsvp-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (touched.name) setErrors((err) => ({ ...err, name: e.target.value.trim() ? undefined : "Name is required." })); }}
                    onBlur={() => onBlur("name")}
                    placeholder="Your name"
                    aria-invalid={nameInvalid}
                    aria-describedby="rsvp-name-error"
                    className="field mt-2"
                  />
                  <FieldError id="rsvp-name-error" show={nameInvalid} message={errors.name} />
                </div>

                <div role="radiogroup" aria-labelledby="rsvp-attendance" aria-describedby="rsvp-attendance-error">
                  <p id="rsvp-attendance" className="eyebrow text-ink/50">
                    Attendance <span className="text-gold">*</span>
                  </p>
                  {/* Segmented control — the fill glides to the chosen answer */}
                  <div
                    className={`mt-4 grid grid-cols-2 rounded-full border p-1.5 transition-colors duration-500 ${
                      attendanceInvalid ? "border-[#C2553F]" : "border-ink/15"
                    }`}
                  >
                    {(["yes", "no"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        role="radio"
                        aria-checked={attendance === opt}
                        onClick={() => {
                          setAttendance(opt);
                          setErrors((err) => ({ ...err, attendance: undefined }));
                          setTouched((t) => ({ ...t, attendance: true }));
                        }}
                        className={`eyebrow relative rounded-full px-2 py-4 !text-[0.625rem] !tracking-[0.16em] transition-colors duration-500 ${
                          attendance === opt ? "text-paper" : "text-ink/60 hover:text-ink"
                        }`}
                      >
                        {attendance === opt && (
                          <motion.span
                            layoutId="rsvp-choice"
                            className="absolute inset-0 rounded-full bg-ink"
                            transition={{ type: "spring", stiffness: 360, damping: 32 }}
                          />
                        )}
                        <span className="relative">{opt === "yes" ? "Joyfully accepts" : "Regretfully declines"}</span>
                      </button>
                    ))}
                  </div>
                  <FieldError id="rsvp-attendance-error" show={attendanceInvalid} message={errors.attendance} />
                </div>

                <div>
                  <label htmlFor="rsvp-message" className="eyebrow block text-ink/50">
                    Message
                  </label>
                  <textarea
                    id="rsvp-message"
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="A note for the couple (optional)"
                    className="field mt-2 resize-none"
                  />
                </div>

                <AnimatePresence>
                  {errors.form && (
                    <motion.p
                      role="alert"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="-mt-4 text-xs text-[#C2553F]"
                    >
                      {errors.form}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  className="btn-fill eyebrow w-full rounded-full border border-ink py-5 text-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
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
                role="status"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EXPO }}
                className="flex flex-col gap-6 py-6"
              >
                {/* Seal that draws itself */}
                <svg viewBox="0 0 64 64" className="h-16 w-16 text-gold" fill="none" stroke="currentColor" strokeWidth="1.25" aria-hidden="true">
                  <motion.circle
                    cx="32" cy="32" r="30"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.2, ease: EXPO }}
                  />
                  <motion.path
                    d={attendance === "yes" ? "M20 33l8 8 16-18" : "M32 44s-12-7-12-15a6.5 6.5 0 0 1 12-3 6.5 6.5 0 0 1 12 3c0 8-12 15-12 15z"}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.9, ease: EXPO, delay: 0.6 }}
                  />
                </svg>
                <p className="eyebrow text-ink/50">Thank you</p>
                <h3 className="display text-[clamp(2.6rem,5vw,4.25rem)]">
                  {attendance === "yes" ? (
                    <>We can&apos;t wait <em>to see you.</em></>
                  ) : (
                    <>You will be <em>missed.</em></>
                  )}
                </h3>
                <p className="font-serif text-xl italic leading-relaxed text-ink/65">
                  {attendance === "yes"
                    ? `${name}, your RSVP has been received.`
                    : `${name}, we're sorry you can't make it. We'll be thinking of you.`}
                  <br />
                  <span className="text-gold">{COUPLE.fullNames}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function FieldError({ id, show, message }: { id: string; show: boolean; message?: string }) {
  return (
    <div id={id} aria-live="polite">
      <AnimatePresence>
        {show && message && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-xs text-[#C2553F]"
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
