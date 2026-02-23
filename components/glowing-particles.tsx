"use client";

import { useMemo } from "react";

const PARTICLE_COUNT = 24;

/** Deterministic PRNG so server and client render the same HTML (avoids hydration mismatch). */
function createSeededRandom(seed: number) {
  return function next(): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function useParticlePositions() {
  return useMemo(() => {
    const r = createSeededRandom(0x0f172a); // fixed seed for reproducibility
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: r() * 100,
      y: r() * 100,
      size: 2 + r() * 2.5,
      delay: r() * 4,
      duration: 3 + r() * 4,
    }));
  }, []);
}

export function GlowingParticles() {
  const particles = useParticlePositions();

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-white/70"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            boxShadow: `0 0 ${p.size * 2}px rgba(255,255,255,0.25)`,
            animation: "particle-glow 4s ease-in-out infinite",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
