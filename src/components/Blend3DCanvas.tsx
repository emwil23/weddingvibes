"use client";

import { useEffect, useRef } from "react";
import { Renderer, Camera, Transform, Geometry, Program, Mesh } from "ogl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "next-themes";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Identical shaders — OGL uses the same GLSL, same built-in uniforms
const vertexShader = `
  uniform float uTime;
  uniform float uScrollProgress;

  attribute vec3 position;
  attribute vec3 aRandomTarget;
  attribute float aSize;

  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  varying float vAlpha;

  void main() {
    float transitionFactor = smoothstep(0.90, 0.98, uScrollProgress);
    vec3 mergedPos = mix(position, aRandomTarget, transitionFactor);

    float waveStrength = mix(1.0, 0.2, transitionFactor);
    mergedPos.x += sin(uTime * 0.5 + mergedPos.y * 2.0) * 0.2 * waveStrength;
    mergedPos.y += cos(uTime * 0.3 + mergedPos.x * 2.0) * 0.2 * waveStrength;

    vec4 mvPosition = modelViewMatrix * vec4(mergedPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * (25.0 / -mvPosition.z);
    vAlpha = smoothstep(-5.0, 5.0, mergedPos.z) * 0.8 + 0.2;
  }
`;

const fragmentShader = `
  precision highp float;
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    vec2 p = (gl_PointCoord * 2.0 - 1.0) * 1.15;
    p.y = -p.y;
    float x = p.x;
    float y = (p.y + 0.1) - 0.5 * sqrt(abs(x));
    float dist = x * x + y * y;
    float alpha = smoothstep(1.0, 0.8, dist) * vAlpha;
    if (alpha <= 0.0) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function buildParticles(count: number) {
  const pos = new Float32Array(count * 3);
  const tar = new Float32Array(count * 3);
  const siz = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 20;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

    let tx = 0, ty = 0, tz = 0, found = false;
    while (!found) {
      tx = Math.random() * 2.4 - 1.2;
      ty = Math.random() * 2.5 - 1.2;
      tz = Math.random() * 2.4 - 1.2;
      const t1 = tx * tx + 2.25 * tz * tz + ty * ty - 1.0;
      if (t1 * t1 * t1 - tx * tx * ty * ty * ty - 0.1125 * tz * tz * ty * ty * ty <= 0) found = true;
    }
    const s = 2.2;
    tar[i * 3]     = tx * s;
    tar[i * 3 + 1] = ty * s;
    tar[i * 3 + 2] = tz * s;
    siz[i] = Math.random() * 2.0 + 1.0;
  }
  return { pos, tar, siz };
}

export default function Blend3DCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);

  useEffect(() => { themeRef.current = resolvedTheme; }, [resolvedTheme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isMobile = window.innerWidth <= 768;
    const particleCount = isMobile ? 200 : 1000;

    // Renderer
    const renderer = new Renderer({
      alpha: true,
      antialias: !isMobile,
      dpr: isMobile ? 1 : Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;
    Object.assign(gl.canvas.style, { width: "100%", height: "100%", display: "block" });
    container.appendChild(gl.canvas);

    // Additive blending (same as THREE.AdditiveBlending)
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    const camera = new Camera(gl, { fov: 60 });
    camera.position.z = 8;

    const scene = new Transform();

    const { pos, tar, siz } = buildParticles(particleCount);

    const geometry = new Geometry(gl, {
      position:      { size: 3, data: pos },
      aRandomTarget: { size: 3, data: tar },
      aSize:         { size: 1, data: siz },
    });

    const isDark = () => themeRef.current === "dark";
    const getColor = (): [number, number, number] =>
      isDark() ? [0.722, 0.486, 0.467] : [0.933, 0.839, 0.827];

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime:           { value: 0 },
        uScrollProgress: { value: 0 },
        uColor:          { value: getColor() },
      },
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    const mesh = new Mesh(gl, { geometry, program, mode: gl.POINTS });
    mesh.setParent(scene);

    function resize() {
      const w = container!.offsetWidth;
      const h = container!.offsetHeight;
      renderer.setSize(w, h);
      camera.perspective({ aspect: w / h });
    }
    window.addEventListener("resize", resize);
    resize();

    // GSAP scroll
    const scrollRef = { progress: 0 };
    const ctx = gsap.context(() => {
      gsap.to(scrollRef, {
        progress: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "#particle-wrapper",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    });

    // RAF at 24fps
    let lastTime = 0;
    let smoothProgress = 0;
    let ry = 0, rx = 0;
    let rafId: number;

    function update(time: number) {
      rafId = requestAnimationFrame(update);
      if (time - lastTime < 1000 / 24) return;
      const delta = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      program.uniforms.uTime.value += delta;
      smoothProgress += (scrollRef.progress - smoothProgress) * 0.1;
      program.uniforms.uScrollProgress.value = smoothProgress;
      program.uniforms.uColor.value = getColor();

      if (smoothProgress > 0.75) {
        const t = Math.max(0, Math.min(1, (smoothProgress - 0.75) / 0.23));
        mesh.rotation.x *= (1 - t);
        mesh.rotation.y *= (1 - t);
        mesh.position.y = (isMobile ? -2.8 : -1.8) * t;
        const sc = isMobile ? 1 - 0.42 * t : 1 + 0.3 * t;
        mesh.scale.set(sc, sc, sc);
      } else {
        ry += delta * 0.05;
        rx += delta * 0.02;
        mesh.rotation.y = ry;
        mesh.rotation.x = rx;
        mesh.position.y = 0;
        mesh.scale.set(1, 1, 1);
      }

      renderer.render({ scene, camera });
    }

    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      ctx.revert();
      if (container.contains(gl.canvas)) container.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
    />
  );
}
