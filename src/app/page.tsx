"use client";

import Loader from "@/components/Loader";
import CustomCursor from "@/components/CustomCursor";
import MusicPlayer from "@/components/MusicPlayer";
import Navbar from "@/components/Navbar";
import Journey from "@/components/Journey";
import RSVP from "@/components/RSVP";
import Footer from "@/components/Footer";
import Water from "@/components/Water";

export default function Home() {
  return (
    <main className="relative">
      <Loader />
      <MusicPlayer />
      <CustomCursor />
      <Navbar />
      <Journey />
      {/* Journey's end: the river at dusk, seen from above, with the reply floating on it */}
      <div className="relative bg-dusk">
        <div className="sticky top-0 -mb-[100dvh] h-dvh motion-reduce:hidden">
          <Water colors={["#EED5C6", "#D9BECB", "#EFD7C8", "#D6BACD"]} className="h-full w-full" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[35vh] bg-gradient-to-b from-dusk to-transparent" />
        <RSVP />
        <Footer />
      </div>
    </main>
  );
}
