"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { reducedMotion } from "@/components/Motion";

// ─── The water, seen from inside ─────────────────────────────────────────────
// A screen-sized pool of liquid that rises from the bottom edge to `state.level`.
// Two pigments lie one above the other, like the two streams; as `state.mix` rises
// their seam marbles and they steep into one colour. The pointer stirs it, a tap
// sends a ring across it, and scrolling makes it run faster.

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

// level: height of the waterline as a fraction of the screen (above 1.1 the pool is full)
export type WaterState = { on: boolean; mix: number; level: number };
const BLENDED: WaterState = { on: true, mix: 1, level: 2 };
const lerp = (a: number[], b: number[], t: number, out: number[]) => {
  for (let i = 0; i < 3; i++) out[i] = a[i] + (b[i] - a[i]) * t;
};

const vertex = /* glsl */ `
  attribute vec2 uv;
  attribute vec2 position;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAspect;
  uniform float uMix;
  uniform float uLevel;
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uJ1;
  uniform vec3 uJ2;
  uniform vec2 uMouse;
  uniform vec3 uClick; // xy = position, z = seconds since the tap
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = m * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 asp = vec2(uAspect, 1.0);
    vec2 p = (vUv - 0.5) * asp;

    // A tap sends one ring across the surface
    vec2 c = (uClick.xy - 0.5) * asp;
    float age = uClick.z;
    float front = length(p - c) - age * 0.55;
    float ring = sin(34.0 * front) * exp(-9.0 * abs(front)) * exp(-1.6 * age);
    p += normalize(p - c + 1e-4) * ring * 0.03;

    // The pointer stirs
    vec2 dm = p - (uMouse - 0.5) * asp;
    p += vec2(-dm.y, dm.x) * exp(-dot(dm, dm) * 5.0) * 0.35;

    // Domain-warped noise: slow currents
    float t = uTime * 0.06;
    vec2 q = vec2(fbm(p * 1.6 + t), fbm(p * 1.6 + vec2(5.2, 1.3) - t));
    vec2 r = vec2(
      fbm(p * 1.6 + 3.0 * q + vec2(1.7, 9.2) + t * 1.5),
      fbm(p * 1.6 + 3.0 * q + vec2(8.3, 2.8) - t * 1.2)
    );
    float f = fbm(p * 1.6 + 3.0 * r);
    float tone = smoothstep(0.2, 0.85, f);

    // Two pigments, one above the other, with a seam that marbles as they blend
    // The seam sits halfway up the water, so both layers rise together
    float seam = (min(uLevel, 1.0) * 0.5 - 0.5 - p.y) * (1.6 - 1.25 * uMix) + (f - 0.5) * (0.5 + 2.4 * uMix) + (r.x - 0.5) * 0.7 * uMix;
    vec3 col = mix(uA, uB, smoothstep(-0.07, 0.07, seam)) * (0.88 + 0.24 * tone);
    col = mix(col, mix(uJ1, uJ2, tone), smoothstep(0.45, 1.0, uMix));

    col += 0.05 * smoothstep(0.55, 0.9, length(q)); // light caught on the surface
    col += ring * 0.04;
    col *= 1.0 - 0.1 * dot(p, p);

    // The waterline: a slow swell with a soft, pale lip
    float swell = 0.03 * sin(p.x * 2.6 + uTime * 0.5) + 0.07 * (noise(vec2(p.x * 1.8 + uTime * 0.12, uTime * 0.08)) - 0.5);
    float above = vUv.y - (uLevel + swell);
    float alpha = smoothstep(0.012, -0.012, above);
    col += 0.14 * smoothstep(-0.035, 0.0, above);
    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

export default function Water({
  colors,
  shallow,
  state = BLENDED,
  className = "",
  ...rest
}: {
  colors: [a: string, b: string, joinedLight: string, joinedDeep: string];
  // What the three colours look like while the water is still low; they deepen as it rises
  shallow?: [a: string, b: string, joined: string];
  state?: WaterState;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const still = reducedMotion();

    // Soft liquid needs no detail: render at half the CSS resolution and let it scale up
    const renderer = new Renderer({ dpr: 0.5, alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    wrap.appendChild(gl.canvas);

    const [a, b, j1, j2] = colors.map(rgb);
    const low = shallow?.map(rgb);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uMix: { value: state.mix },
        uLevel: { value: state.level },
        uA: { value: [...a] },
        uB: { value: [...b] },
        uJ1: { value: [...j1] },
        uJ2: { value: [...j2] },
        uMouse: { value: [0.5, 0.5] },
        uClick: { value: [0.5, 0.5, 99] },
      },
      transparent: true,
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let w = 0;
    let h = 0;
    function resize() {
      // Phones fire resize as the address bar moves; resizing a canvas clears it, so skip no-ops
      if (wrap!.offsetWidth === w && wrap!.offsetHeight === h) return;
      w = wrap!.offsetWidth;
      h = wrap!.offsetHeight;
      renderer.setSize(w, h);
      Object.assign(gl.canvas.style, { width: "100%", height: "100%", display: "block" });
      program.uniforms.uAspect.value = w / (h || 1);
    }
    resize();
    window.addEventListener("resize", resize);

    // The pool always fills the screen, so pointer positions are simply viewport fractions
    const target = [0.5, 0.5];
    function onMove(e: PointerEvent) {
      target[0] = e.clientX / window.innerWidth;
      target[1] = 1 - e.clientY / window.innerHeight;
    }
    function onDown(e: PointerEvent) {
      if (!state.on || !visible) return;
      const u = program.uniforms.uClick.value as number[];
      u[0] = e.clientX / window.innerWidth;
      u[1] = 1 - e.clientY / window.innerHeight;
      u[2] = 0;
    }
    if (!still) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onDown, { passive: true });
    }

    // Paint only while on screen and switched on
    let visible = false;
    let raf = 0;
    let last = performance.now();
    let lastScroll = window.scrollY;
    let stir = 0;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    });
    io.observe(wrap);

    function frame(now: number) {
      if (!visible) return;
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!state.on) return;
      const u = program.uniforms;

      // Scrolling stirs the water: it runs faster, then settles
      const y = window.scrollY;
      stir += (Math.min(Math.abs(y - lastScroll) / 40, 3) - stir) * 0.08;
      lastScroll = y;
      if (!still) u.uTime.value += dt * (1 + stir * 2.5);

      const m = u.uMouse.value as number[];
      m[0] += (target[0] - m[0]) * 0.06;
      m[1] += (target[1] - m[1]) * 0.06;
      (u.uClick.value as number[])[2] += dt;
      u.uMix.value = state.mix;
      u.uLevel.value = state.level;
      if (low) {
        const deep = Math.min(1, Math.max(0, (state.level - 0.25) / 0.6));
        lerp(low[0], a, deep, u.uA.value as number[]);
        lerp(low[1], b, deep, u.uB.value as number[]);
        lerp(low[2], j1, deep, u.uJ1.value as number[]);
        lerp(low[2], j2, deep, u.uJ2.value as number[]);
      }
      renderer.render({ scene: mesh });
    }

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      if (wrap.contains(gl.canvas)) wrap.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
    // colors and state are fixed for the life of the pool
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={wrapRef} aria-hidden="true" className={`pointer-events-none ${className}`} {...rest} />;
}
