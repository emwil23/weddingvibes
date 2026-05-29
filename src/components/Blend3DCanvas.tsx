"use client";

import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, invalidate } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTheme } from "next-themes";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const vertexShader = `
  uniform float uTime;
  uniform float uScrollProgress;
  
  attribute vec3 aRandomTarget;
  attribute float aSize;
  
  varying float vAlpha;
  
  void main() {
    // Determine the interpolation factor. 
    // We want the particles to float freely until 90% scroll, then transition to the target heart shape between 90% and 100% scroll depth.
    float transitionFactor = smoothstep(0.90, 0.98, uScrollProgress);
    
    // Interpolate between initial scattered position and organized target heart position
    vec3 mergedPos = mix(position, aRandomTarget, transitionFactor);
    
    // Add subtle fluid wave motion (fade the wave motion down but keep a gentle micro-movement when fully merged to look alive)
    float waveStrength = mix(1.0, 0.2, transitionFactor);
    mergedPos.x += sin(uTime * 0.5 + mergedPos.y * 2.0) * 0.2 * waveStrength;
    mergedPos.y += cos(uTime * 0.3 + mergedPos.x * 2.0) * 0.2 * waveStrength;
    
    vec4 mvPosition = modelViewMatrix * vec4(mergedPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Scale particle size based on depth and initial size
    gl_PointSize = aSize * (25.0 / -mvPosition.z);
    
    // Fade alpha based on z-depth
    vAlpha = smoothstep(-5.0, 5.0, mergedPos.z) * 0.8 + 0.2;
  }
`;

const fragmentShader = `
  uniform vec3 uColor;
  varying float vAlpha;
  
  void main() {
    // Center coordinates from [0, 1] to [-1, 1] and scale slightly to avoid clipping
    vec2 p = (gl_PointCoord * 2.0 - 1.0) * 1.15;
    
    // Flip y so positive is up
    p.y = -p.y;
    
    // Heart shape equation: x^2 + (y - 0.5 * sqrt(|x|))^2 <= 1.0
    float x = p.x;
    float y = (p.y + 0.1) - 0.5 * sqrt(abs(x));
    float dist = x * x + y * y;
    
    // Smooth anti-aliased edge
    float alpha = smoothstep(1.0, 0.8, dist) * vAlpha;
    if (alpha <= 0.0) discard;
    
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function ParticleBlend({ isMobile }: { isMobile: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const scrollRef = useRef({ progress: 0 });
  const { resolvedTheme } = useTheme();

  // Determine colors based on theme
  const isLightBg = resolvedTheme === "dark"; 
  const particleColor = new THREE.Color(isLightBg ? "#B87C77" : "#EED6D3");

  // Mobile optimization: 75% fewer particles
  const particleCount = isMobile ? 1500 : 7500;

  const [positions, targets, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const tar = new Float32Array(particleCount * 3);
    const siz = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      // Initial scattered position (wide spread)
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;

      // Target merged position (3D heart shape via rejection sampling)
      let tx = 0, ty = 0, tz = 0;
      let found = false;
      while (!found) {
        tx = (Math.random() * 2.4 - 1.2);
        ty = (Math.random() * 2.5 - 1.2); // y offset range [-1.2, 1.3]
        tz = (Math.random() * 2.4 - 1.2);
        
        const term1 = tx * tx + 2.25 * tz * tz + ty * ty - 1.0;
        const val = term1 * term1 * term1 - tx * tx * ty * ty * ty - 0.1125 * tz * tz * ty * ty * ty;
        if (val <= 0.0) {
          found = true;
        }
      }
      
      // Scale coordinates so the heart matches the dimensions of the monogram text in the footer
      const scale = 2.2;
      tar[i * 3] = tx * scale;
      tar[i * 3 + 1] = ty * scale;
      tar[i * 3 + 2] = tz * scale;

      siz[i] = Math.random() * 2.0 + 1.0;
    }
    return [pos, tar, siz];
  }, [particleCount]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(scrollRef.current, {
        progress: 1.0,
        ease: "none",
        scrollTrigger: {
          trigger: "#particle-wrapper",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  // 24 FPS lock mechanism:
  // Using frameloop="demand" and a setInterval to invalidate the scene at exactly 24fps
  useEffect(() => {
    const fps = 24;
    const intervalId = setInterval(() => {
      invalidate();
    }, 1000 / fps);
    return () => clearInterval(intervalId);
  }, []);

  useFrame((state, delta) => {
    let smoothProgress = 0;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      // Smoothly catch up to the gsap scroll progress for fluid easing
      materialRef.current.uniforms.uScrollProgress.value += 
        (scrollRef.current.progress - materialRef.current.uniforms.uScrollProgress.value) * 0.1;
      materialRef.current.uniforms.uColor.value = particleColor;
      smoothProgress = materialRef.current.uniforms.uScrollProgress.value;
    }
    if (pointsRef.current) {
      // Shift, scale, and align the heart as it merges in the last part (from 75% to 100%)
      if (smoothProgress > 0.75) {
        const t = Math.max(0.0, Math.min(1.0, (smoothProgress - 0.75) / 0.23));
        
        // Damp both X and Y rotations to 0 so the heart faces forward statically
        pointsRef.current.rotation.x *= (1.0 - t);
        pointsRef.current.rotation.y *= (1.0 - t);
        
        // Smoothly shift the Y coordinate down to align with the "T&E" monogram in the footer
        pointsRef.current.position.y = (isMobile ? -3.1 : -1.8) * t;
        
        // Scale the heart to be larger on desktop, but shrink it on mobile to fit the narrow viewport
        pointsRef.current.scale.setScalar(isMobile ? (1.0 - 0.42 * t) : (1.0 + 0.3 * t));
      } else {
        // Free rotation when scattered
        pointsRef.current.rotation.y += delta * 0.05;
        pointsRef.current.rotation.x += delta * 0.02;
        pointsRef.current.position.y = 0;
        pointsRef.current.scale.setScalar(1.0);
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-aRandomTarget"
          args={[targets, 3]}
        />
        <bufferAttribute
          attach="attributes-aSize"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uScrollProgress: { value: 0 },
          uColor: { value: particleColor }
        }}
      />
    </points>
  );
}

export default function Blend3DCanvas() {
  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-[1]">
      <Canvas
        frameloop="demand"
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ alpha: true, antialias: !isMobile, powerPreference: "high-performance" }}
        dpr={isMobile ? 1 : [1, 2]} // Lower DPR on mobile for performance
      >
        <ParticleBlend isMobile={isMobile} />
      </Canvas>
    </div>
  );
}
