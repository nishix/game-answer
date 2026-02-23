"use client";

import { useGameStore } from "@/lib/store/gameStore";

export function FloatingEmojis() {
  const incomingReactions = useGameStore((s) => s.incomingReactions);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-64 overflow-hidden"
      aria-hidden="true"
    >
      {incomingReactions.map((r) => (
        <span
          key={r.id}
          className="absolute bottom-16 text-3xl"
          style={{
            left: `${r.x}%`,
            animation:
              "float-up 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}
