import { NextRequest, NextResponse } from "next/server";

// In-memory store: ip → { count, resetAt }
// Single dyno on Heroku — this persists for the lifetime of the process
const store = new Map<string, { count: number; resetAt: number }>();

const LIMIT = 3;           // max submissions per window
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function getRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: LIMIT - 1 };
  }

  if (entry.count >= LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: LIMIT - entry.count };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed } = getRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { name, email, attendance, message, _hp } = body;

  // Honeypot — bots fill hidden fields, humans don't
  if (_hp) {
    return NextResponse.json({ result: "ok" }); // silently drop
  }

  // Server-side validation
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }
  if (!email?.trim() || !isValidEmail(email)) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }
  if (attendance !== "yes" && attendance !== "no") {
    return NextResponse.json({ error: "Please select attendance." }, { status: 400 });
  }

  const scriptUrl = process.env.SCRIPT_URL; // server-only — not NEXT_PUBLIC
  if (!scriptUrl) {
    return NextResponse.json({ error: "Service unavailable." }, { status: 503 });
  }

  try {
    await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ name, email, attendance, message: message ?? "" }).toString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to save RSVP. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ result: "ok" });
}
