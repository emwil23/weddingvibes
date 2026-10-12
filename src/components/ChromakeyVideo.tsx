"use client";

import { useEffect, useRef, useState } from "react";
import { Renderer, Triangle, Program, Mesh, Texture } from "ogl";

interface Props {
  mp4Src: string;
  mobileSrc?: string; // smaller encode served when viewport <= 768px
  keyColor?: [number, number, number];
  hueTolerance?: number;
  satMin?: number;
  walkOnScroll?: boolean; // advance only while the page is scrolling, hold still otherwise
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
  mobileSrc,
  keyColor = [97, 133, 86],
  hueTolerance = 30,
  satMin = 0.15,
  walkOnScroll = false,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [src, setSrc] = useState(mp4Src);

  useEffect(() => {
    setSrc(mobileSrc && window.innerWidth <= 768 ? mobileSrc : mp4Src);
    setReady(true);
  }, [mp4Src, mobileSrc]);

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

    // Resizing a canvas clears it, and phones fire resize whenever the address bar moves:
    // skip no-ops, and after a real one redraw even if the film is paused
    let cw = 0;
    let ch = 0;
    let dirty = false;
    function size() {
      const w = video!.videoWidth || 1280;
      const h = video!.videoHeight || 720;
      const nw = container!.offsetWidth;
      const nh = Math.round(nw * (h / w));
      if (nw === cw && nh === ch) return;
      cw = nw;
      ch = nh;
      renderer.setSize(nw, nh);
      dirty = true;
    }

    let rafId = 0;
    let lastTime = 0;
    let visible = false;

    function loop(t: number) {
      if (!visible) return; // restarted by the observer
      rafId = requestAnimationFrame(loop);
      if (video!.readyState < 2) return;
      if (!dirty) {
        if (video!.paused || video!.ended) return;
        // ~24fps throttle
        if (t - lastTime < 40) return;
      }
      dirty = false;
      lastTime = t;

      texture.image = video as unknown as HTMLImageElement;
      texture.needsUpdate = true;
      renderer.render({ scene: mesh });
    }

    // walkOnScroll: play on every scroll event, stop shortly after the last one
    let idle = 0;
    function step() {
      if (!visible) return;
      video!.play().catch(() => {});
      window.clearTimeout(idle);
      idle = window.setTimeout(rest, 170);
    }
    // iOS can take longer than that to start a film; never pause before there is a frame to hold
    function rest() {
      if (visible && (video!.readyState < 2 || video!.currentTime === 0)) idle = window.setTimeout(rest, 120);
      else video!.pause();
    }

    function onLoaded() {
      size();
      if (!visible) return;
      if (walkOnScroll) step(); // a few frames so there is a pose to hold
      else video!.play().catch(() => {});
    }
    if (walkOnScroll) window.addEventListener("scroll", step, { passive: true });

    // Decode, upload and draw frames only while on screen — every instance used to run forever
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        cancelAnimationFrame(rafId);
        if (visible) {
          if (walkOnScroll) step();
          else video.play().catch(() => {});
          rafId = requestAnimationFrame(loop);
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(container);

    if (video.readyState >= 2) onLoaded();
    else video.addEventListener("loadeddata", onLoaded, { once: true });

    window.addEventListener("resize", size);

    return () => {
      io.disconnect();
      window.clearTimeout(idle);
      window.removeEventListener("scroll", step);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", size);
      video.removeEventListener("loadeddata", onLoaded);
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [ready, src, walkOnScroll]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      {/* Source video kept rendered (mobile refuses to decode display:none video)
          but visually hidden behind the canvas */}
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        autoPlay={!walkOnScroll}
        preload="auto"
        crossOrigin="anonymous"
        src={src}
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0.01,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
    </div>
  );
}
