import { GlowingParticles } from "./glowing-particles";

export function AuroraBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* Base: visible gradient from navy (bottom-left) to emerald/turquoise (top-right) */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #0f1f2e 25%, #0d2838 50%, #0c3d3d 75%, #134e4a 90%, #115e59 100%)",
        }}
      />

      {/* Strong aurora blobs - emerald/turquoise, high visibility */}
      <div
        className="absolute -top-1/2 -left-1/3 h-[180%] w-[180%] opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 20%, rgba(45, 212, 191, 0.55) 0%, rgba(20, 184, 166, 0.25) 35%, transparent 60%), radial-gradient(ellipse 60% 70% at 75% 40%, rgba(52, 211, 153, 0.45) 0%, rgba(16, 185, 129, 0.2) 40%, transparent 65%), radial-gradient(ellipse 50% 50% at 50% 85%, rgba(20, 184, 166, 0.35) 0%, transparent 55%)",
          backgroundSize: "200% 200%",
          animation: "aurora-shift 18s ease-in-out infinite",
        }}
      />

      {/* Secondary layer - cyan/indigo for depth and variation */}
      <div
        className="absolute -top-1/3 -right-1/4 h-[150%] w-[150%] opacity-70"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(34, 211, 238, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 20% 75%, rgba(129, 140, 248, 0.25) 0%, transparent 50%)",
          backgroundSize: "200% 200%",
          animation: "aurora-shift-2 22s ease-in-out infinite",
        }}
      />

      <GlowingParticles />

      {/* Light vignette - keep aurora visible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(15, 23, 42, 0.35) 100%)",
        }}
      />
    </div>
  );
}
