"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  mp4Src: string;
  keyColor?: [number, number, number];
  hueTolerance?: number;
  satMin?: number;
  className?: string;
}

export default function ChromakeyVideo({
  mp4Src,
  keyColor = [97, 133, 86],
  hueTolerance = 30,
  satMin = 0.15,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [ready, setReady] = useState(false);

  // Trigger canvas setup after hydration
  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    if (!ready) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Pre-compute key hue
    const [kr, kg, kb] = keyColor.map((c) => c / 255);
    const kmax = Math.max(kr, kg, kb), kmin = Math.min(kr, kg, kb), kd = kmax - kmin;
    let keyH = 0;
    if (kd !== 0) {
      if (kmax === kr) keyH = ((kg - kb) / kd) % 6;
      else if (kmax === kg) keyH = (kb - kr) / kd + 2;
      else keyH = (kr - kg) / kd + 4;
      keyH = (keyH * 60 + 360) % 360;
    }

    const softEdge = hueTolerance * 1.5;
    const invSoftRange = 1 / (hueTolerance * 0.5);

    function processFrame(timestamp: number) {
      if (!video || !canvas || !ctx || video.paused || video.ended) return;

      // Throttle to ~24fps
      if (timestamp - lastTimeRef.current < 40) {
        rafRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastTimeRef.current = timestamp;

      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.drawImage(video, 0, 0);

      let frame: ImageData;
      try {
        frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        rafRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const data = frame.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        const max = r > g ? (r > b ? r : b) : (g > b ? g : b);
        const min = r < g ? (r < b ? r : b) : (g < b ? g : b);
        const d = max - min;

        if (d === 0 || d / max < satMin) continue;

        let h = 0;
        if (max === r) h = ((g - b) / d) % 6;
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h = (h * 60 + 360) % 360;

        const hueDiff = Math.abs(((h - keyH + 540) % 360) - 180);
        if (hueDiff < hueTolerance) {
          data[i + 3] = 0;
        } else if (hueDiff < softEdge) {
          data[i + 3] = Math.round((hueDiff - hueTolerance) * invSoftRange * 255);
        }
      }

      ctx.putImageData(frame, 0, 0);
      rafRef.current = requestAnimationFrame(processFrame);
    }

    function onPlay() {
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(processFrame);
    }

    video.addEventListener("play", onPlay);
    video.play().catch(() => {});

    return () => {
      video.removeEventListener("play", onPlay);
      cancelAnimationFrame(rafRef.current);
    };
  }, [ready]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        src={mp4Src}
        className="hidden"
      />
      <canvas ref={canvasRef} className="w-full h-auto" />
    </div>
  );
}
