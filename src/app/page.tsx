"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Timeline from "@/components/Timeline";
import Gallery from "@/components/Gallery";
import Location from "@/components/Location";
import RSVP from "@/components/RSVP";
import Footer from "@/components/Footer";

export default function Home() {
  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 0.8,
      touchMultiplier: 1.5,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const id = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
    };
  }, []);

  return (
    <main className="relative">
      <CustomCursor />
      <Navbar />
      {/* Left gutter offset on desktop so content isn't behind the fixed nav */}
      <div className="lg:pl-20">
        <Hero />
        <Timeline />
        <Gallery />
        <Location />
        <RSVP />
        <Footer />
      </div>
    </main>
  );
}
