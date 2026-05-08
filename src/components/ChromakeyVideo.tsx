"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  webmSrc: string;
  mp4Src: string;
  keyColor?: [number, number, number];
  hueTolerance?: number;   // degrees either side of key hue, default 30
  satMin?: number;         // min saturation to key (0–1), default 0.15
  className?: string;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

function isSafari() {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export default function ChromakeyVideo({
  webmSrc,
  mp4Src,
  keyColor = [97, 133, 86],
  hueTolerance = 30,
  satMin = 0.15,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [useSafari, setUseSafari] = useState(false);

  useEffect(() => {
    setUseSafari(isSafari()); // detect after hydration — avoids SSR mismatch
  }, []);

  useEffect(() => {
    if (!useSafari) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const [keyH] = rgbToHsv(...keyColor);

    function processFrame() {
      if (!video || !canvas || !ctx || video.paused || video.ended) return;

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
        const [h, s] = rgbToHsv(data[i], data[i + 1], data[i + 2]);
        if (s < satMin) continue; // unsaturated pixel — never key out

        // Angular distance between pixel hue and key hue
        const hueDiff = Math.abs(((h - keyH + 540) % 360) - 180);

        if (hueDiff < hueTolerance) {
          // Fully inside key range → fully transparent
          data[i + 3] = 0;
        } else if (hueDiff < hueTolerance * 1.5) {
          // Soft edge zone → fade out
          const t = (hueDiff - hueTolerance) / (hueTolerance * 0.5);
          data[i + 3] = Math.round(t * 255);
        }
      }

      ctx.putImageData(frame, 0, 0);
      rafRef.current = requestAnimationFrame(processFrame);
    }

    function onPlay() {
      rafRef.current = requestAnimationFrame(processFrame);
    }

    video.addEventListener("play", onPlay);
    video.play().catch(() => {});

    return () => {
      video.removeEventListener("play", onPlay);
      cancelAnimationFrame(rafRef.current);
    };
  }, [useSafari]);

  if (!useSafari) {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={className}
      >
        <source src={webmSrc} type="video/webm" />
        <source src={mp4Src} type="video/mp4" />
      </video>
    );
  }

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
