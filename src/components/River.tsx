"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";
import { dive, journey, paperAt, smoothstep } from "@/lib/journey";
import { reducedMotion } from "@/components/Motion";

// ─── The river ───────────────────────────────────────────────────────────────
// A watercolor wash painted live in the bottom band of the stage. Two streams — rose
// and indigo — spring up at sourceX, run side by side, and become one at confluenceX.
// The canvas is fixed to the screen; the world slides under it by journey.x.

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
  uniform float uOffset;     // world x of the canvas' left edge, in canvas heights
  uniform float uSource;     // world x of the springs
  uniform float uConfluence; // world x where the streams meet
  uniform float uDusk;
  uniform vec3 uPaper;
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
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p = p * 2.03 + 11.7;
      a *= 0.5;
    }
    return v;
  }

  // One stream: soft-edged ribbon, pigment pooled at its edges like wet paint
  // returns x = coverage, y = pigment density
  vec2 stream(float y, float centre, float halfWidth, float wx, float seed) {
    float edge = (fbm(vec2(wx * 1.4, seed)) - 0.5) * 0.09;
    float d = abs(y - centre) - (halfWidth + edge);
    float cover = smoothstep(0.02, -0.02, d);
    float pool = smoothstep(-0.07, 0.0, d) * 0.35;
    float wash = 0.62 + 0.38 * fbm(vec2(wx * 0.9 - uTime * 0.05, y * 3.0 + seed));
    return vec2(cover, cover * (wash + pool));
  }

  void main() {
    float y = vUv.y;
    float wx = vUv.x * uAspect + uOffset;

    float grow = smoothstep(uSource, uSource + 1.6, wx);          // springs widen into streams
    float m = smoothstep(uConfluence - 1.3, uConfluence + 0.9, wx); // 0 apart → 1 joined
    float settled = smoothstep(uConfluence + 1.0, uConfluence + 9.0, wx);

    float sway = 0.035 * sin(wx * 0.7) + 0.02 * sin(wx * 1.9 + 1.3);
    float cyA = mix(0.74 + sway, 0.50 + sway * 0.6, m);
    float cyB = mix(0.27 - sway, 0.50 + sway * 0.6, m);
    float hw = mix(0.105, 0.36 + 0.05 * settled, m) * grow;

    vec2 a = stream(y, cyA, hw, wx, 3.1);
    vec2 b = stream(y, cyB, hw, wx, 7.9);

    vec3 rose = vec3(0.80, 0.47, 0.40);
    vec3 indigo = vec3(0.29, 0.42, 0.63);
    vec3 joined = mix(vec3(0.45, 0.55, 0.72), vec3(0.50, 0.50, 0.74), uDusk);

    // After the confluence the two pigments streak through each other, then settle into one
    float streak = fbm(vec2(wx * 0.5 - uTime * 0.04, y * 5.0));
    vec3 colA = mix(rose, mix(mix(rose, indigo, smoothstep(0.35, 0.65, streak)), joined, settled), m);
    vec3 colB = mix(indigo, mix(mix(indigo, rose, smoothstep(0.35, 0.65, streak)), joined, settled), m);

    // Watercolor is subtractive: each wash filters the paper beneath it
    float dA = clamp(a.y, 0.0, 1.0) * mix(0.82, 0.7, settled);
    float dB = clamp(b.y, 0.0, 1.0) * mix(0.82, 0.7, settled);
    vec3 t = (1.0 - dA * (1.0 - colA)) * (1.0 - dB * (1.0 - colB) * (1.0 - 0.85 * m * a.x));
    float cover = max(a.x, b.x);

    // Ripple marks left by a dry brush, drifting downstream; they catch gold at dusk
    float ripple = smoothstep(0.72, 0.8, noise(vec2(wx * 2.2 - uTime * 0.35, y * 46.0)));
    ripple *= smoothstep(0.3, 0.9, fbm(vec2(wx * 0.8 - uTime * 0.1, y * 2.0))) * cover;
    vec3 col = uPaper * t;
    col = mix(col, mix(uPaper, vec3(1.0, 0.86, 0.6), uDusk * 0.7), ripple * 0.55);

    // Paper tooth
    float grain = hash(gl_FragCoord.xy * 0.71);
    float alpha = cover * (0.9 + 0.1 * grain);
    gl_FragColor = vec4(col * alpha, alpha);
  }
`;

// Where a boat rides at a given screen fraction — mirrors the shader's geometry
export function streamY(screenX: number, aspect: number, h: number, which: "a" | "b") {
  const wx = screenX * aspect + journey.x / h;
  const m = smoothstep(journey.confluenceX / h - 1.3, journey.confluenceX / h + 0.9, wx);
  const sway = 0.035 * Math.sin(wx * 0.7) + 0.02 * Math.sin(wx * 1.9 + 1.3);
  const apart = which === "a" ? 0.74 + sway : 0.27 - sway;
  // Once joined the two boats travel side by side rather than on top of each other
  const together = 0.5 + sway * 0.6 + (which === "a" ? 0.1 : -0.1);
  return {
    y: apart + (together - apart) * m,
    grow: smoothstep(journey.sourceX / h, journey.sourceX / h + 1.6, wx),
    merged: m,
  };
}

export default function River({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const still = reducedMotion();

    // A soft wash needs little detail; capping the pixel ratio keeps phones cool
    const renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio, 1.25) * 0.8,
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
    });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    wrap.appendChild(gl.canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uAspect: { value: 1 },
        uOffset: { value: 0 },
        uSource: { value: 0 },
        uConfluence: { value: 1e4 },
        uDusk: { value: 0 },
        uPaper: { value: [0.957, 0.933, 0.894] },
      },
      transparent: true,
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    let h = 1;
    let w = 0;
    function resize() {
      // Phones fire resize as the address bar moves; resizing a canvas clears it, so skip no-ops
      if (wrap!.offsetWidth === w && wrap!.offsetHeight === h) return;
      w = wrap!.offsetWidth;
      h = wrap!.offsetHeight || 1;
      renderer.setSize(w, h);
      Object.assign(gl.canvas.style, { width: "100%", height: "100%", display: "block" });
      program.uniforms.uAspect.value = w / h;
    }
    resize();
    window.addEventListener("resize", resize);

    // Paint only while the river is on screen
    let visible = true;
    let raf = 0;
    let last = performance.now();
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
      if (dive.under) return; // the water covers the whole screen
      const u = program.uniforms;
      if (!still) u.uTime.value += dt;
      u.uOffset.value = journey.x / h;
      u.uSource.value = journey.sourceX / h;
      u.uConfluence.value = journey.confluenceX / h;
      u.uDusk.value = smoothstep(0.55, 1, journey.progress);
      const [r, g, b] = paperAt(journey.progress);
      const paper = u.uPaper.value as number[];
      paper[0] = r / 255;
      paper[1] = g / 255;
      paper[2] = b / 255;
      renderer.render({ scene: mesh });
    }

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (wrap.contains(gl.canvas)) wrap.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return <div ref={wrapRef} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
