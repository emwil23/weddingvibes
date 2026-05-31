"use client";

import { useEffect } from "react";
import LoadingScreen from "@/components/LoadingScreen";
import CustomCursor from "@/components/CustomCursor";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Timeline from "@/components/Timeline";
import Gallery from "@/components/Gallery";
import Location from "@/components/Location";
import RSVP from "@/components/RSVP";
import Footer from "@/components/Footer";
import MusicPlayer from "@/components/MusicPlayer";
import dynamic from "next/dynamic";

const Blend3DCanvas = dynamic(() => import("@/components/Blend3DCanvas"), {
  ssr: false,
});

export default function Home() {

  return (
    <main className="relative">
      <LoadingScreen />
      <MusicPlayer />
      <CustomCursor />
      <Navbar />
      {/* Left gutter offset on desktop so content isn't behind the fixed nav */}
      <div className="lg:pl-20">
        <Hero />
        
        <div id="particle-wrapper" className="relative">
          <div className="absolute inset-0 pointer-events-none select-none z-[1]">
            <div className="sticky top-0 w-full h-screen">
              <Blend3DCanvas />
            </div>
          </div>
          
          <Timeline />
          <Gallery />
          <Location />
          <RSVP />
          <Footer />
        </div>
      </div>
    </main>
  );
}
