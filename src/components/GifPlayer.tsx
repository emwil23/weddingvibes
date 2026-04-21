"use client";

import { useEffect, useRef } from "react";
import { parseGIF, decompressFrames } from "gifuct-js";

interface GifPlayerProps {
  src: string;
  className?: string;
}

export default function GifPlayer({ src, className }: GifPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(src);
      const buf = await res.arrayBuffer();
      const gif = parseGIF(buf);
      const frames = decompressFrames(gif, true);
      if (!frames.length || cancelled) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;

      canvas.width = frames[0].dims.width;
      canvas.height = frames[0].dims.height;

      const offscreen = document.createElement("canvas");
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext("2d")!;

      let frameIndex = 0;

      function renderFrame() {
        if (cancelled) return;
        const frame = frames[frameIndex];
        const imageData = new ImageData(
          new Uint8ClampedArray(frame.patch),
          frame.dims.width,
          frame.dims.height
        );

        // Dispose previous frame based on disposalType
        if (frame.disposalType === 2) {
          offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
        }

        offCtx.putImageData(imageData, frame.dims.left, frame.dims.top);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(offscreen, 0, 0);

        frameIndex = (frameIndex + 1) % frames.length;
        rafRef.current = window.setTimeout(renderFrame, frame.delay) as unknown as number;
      }

      renderFrame();
    }

    load();

    return () => {
      cancelled = true;
      clearTimeout(rafRef.current);
    };
  }, [src]);

  return <canvas ref={canvasRef} className={className} />;
}
