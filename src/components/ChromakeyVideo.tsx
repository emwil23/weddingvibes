"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Triangle, Program, Mesh, Texture } from "ogl";

interface Props {
  mp4Src: string;
  keyColor?: [number, number, number];
  hueTolerance?: number;
  satMin?: number;
  className?: string;
}

function rgbToHue(r: number, g: number, b: number): number {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

const vertex = `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

// HSV chromakey in fragment shader — GPU keys all pixels in parallel
const fragment = `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uKeyHue;        // degrees
  uniform float uHueTolerance;  // degrees
  uniform float uSatMin;
  varying vec2 vUv;

  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  void main() {
    vec4 color = texture2D(tMap, vUv);
    vec3 hsv = rgb2hsv(color.rgb);
    float hue = hsv.x * 360.0;
    float sat = hsv.y;

    float alpha = 1.0;
    if (sat >= uSatMin) {
      float hueDiff = abs(mod(hue - uKeyHue + 540.0, 360.0) - 180.0);
      float softEdge = uHueTolerance * 1.5;
      if (hueDiff < uHueTolerance) {
        alpha = 0.0;
      } else if (hueDiff < softEdge) {
        alpha = (hueDiff - uHueTolerance) / (uHueTolerance * 0.5);
      }
    }

    gl_FragColor = vec4(color.rgb, color.a * alpha);
  }
`;

export default function ChromakeyVideo({
  mp4Src,
  keyColor = [97, 133, 86],
  hueTolerance = 30,
  satMin = 0.15,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    if (!ready) return;
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const renderer = new Renderer({ alpha: true, premultipliedAlpha: false, dpr: 1 });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    Object.assign(gl.canvas.style, { width: "100%", height: "100%", display: "block" });
    container.appendChild(gl.canvas);

    const texture = new Texture(gl, {
      generateMipmaps: false,
      width: 16,
      height: 16,
      flipY: true, // video Y is top-down
    });

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        tMap: { value: texture },
        uKeyHue: { value: rgbToHue(...keyColor) },
        uHueTolerance: { value: hueTolerance },
        uSatMin: { value: satMin },
      },
      transparent: true,
    });

    const geometry = new Triangle(gl);
    const mesh = new Mesh(gl, { geometry, program });

    function size() {
      const w = video!.videoWidth || 1280;
      const h = video!.videoHeight || 720;
      renderer.setSize(container!.offsetWidth, container!.offsetWidth * (h / w));
    }

    let rafId: number;
    let lastTime = 0;

    function loop(t: number) {
      rafId = requestAnimationFrame(loop);
      if (video!.paused || video!.ended || video!.readyState < 2) return;
      // ~24fps throttle
      if (t - lastTime < 40) return;
      lastTime = t;

      texture.image = video as unknown as HTMLImageElement;
      texture.needsUpdate = true;
      renderer.render({ scene: mesh });
    }

    function onLoaded() {
      size();
      video!.play().catch(() => {});
      rafId = requestAnimationFrame(loop);
    }

    if (video.readyState >= 2) onLoaded();
    else video.addEventListener("loadeddata", onLoaded, { once: true });

    window.addEventListener("resize", size);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", size);
      video.removeEventListener("loadeddata", onLoaded);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [ready, mp4Src]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
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
    </div>
  );
}
