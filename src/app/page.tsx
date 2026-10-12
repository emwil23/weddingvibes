"use client";

import Loader from "@/components/Loader";
import CustomCursor from "@/components/CustomCursor";
import MusicPlayer from "@/components/MusicPlayer";
import Navbar from "@/components/Navbar";
import Journey from "@/components/Journey";
import RSVP from "@/components/RSVP";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="relative">
      <Loader />
      <MusicPlayer />
      <CustomCursor />
      <Navbar />
      <Journey />
      <RSVP />
      <Footer />
    </main>
  );
}
