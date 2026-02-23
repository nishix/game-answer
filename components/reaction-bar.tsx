"use client";

import { useState, useCallback } from "react";
import { useGameRealtime } from "@/hooks/useGameRealtime";
import { useGameStore } from "@/lib/store/gameStore";

const REACTIONS = [
  { emoji: "\u{1F923}", label: "爆笑", color: "#FBBF24" },
  { emoji: "\u{1F91D}", label: "共感・それな", color: "#34D399" },
  { emoji: "\u{1FAE3}", label: "ヤバい・スリル", color: "#A78BFA" },
  { emoji: "\u{1F377}", label: "深い・大人の余裕", color: "#818CF8" },
  { emoji: "\u{1F6A8}", label: "アウト・警告", color: "#F43F5E" },
] as const;

interface ReactionBarProps {
  /** ルーム参加中は指定。未指定時はローカルのみ表示（Broadcast 送信なし） */
  roomId?: string | null;
}

export function ReactionBar({ roomId = null }: ReactionBarProps) {
  const { sendReaction } = useGameRealtime(roomId ?? null);
  const addIncomingReaction = useGameStore((s) => s.addIncomingReaction);

  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(REACTIONS.map((r) => [r.emoji, 0]))
  );
  const [activeEmoji, setActiveEmoji] = useState<string | null>(null);

  const handleReaction = useCallback(
    (emoji: string, index: number) => {
      setCounts((prev) => ({ ...prev, [emoji]: prev[emoji] + 1 }));
      setActiveEmoji(emoji);
      setTimeout(() => setActiveEmoji(null), 300);

      // ローカル表示: store に追加 → FloatingEmojis が表示
      const baseX = 10 + index * 20;
      addIncomingReaction(emoji, baseX + (Math.random() * 10 - 5));

      // ルーム参加中は Broadcast で他プレイヤーにも送信
      if (roomId) sendReaction(emoji);
    },
    [roomId, sendReaction, addIncomingReaction]
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-30">
      {/* Glow effect above bar */}
      <div
        className="pointer-events-none h-20"
        style={{
          background:
            'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Frosted glass bar - 5 buttons evenly spaced */}
      <div className="border-t border-white/[0.08] bg-[#0F172A]/80 px-3 pb-8 pt-3 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-1">
          {REACTIONS.map((reaction, index) => (
            <button
              key={reaction.emoji}
              type="button"
              onClick={() => handleReaction(reaction.emoji, index)}
              className="group flex flex-col items-center gap-1.5 transition-transform duration-300 hover:scale-105 active:scale-95"
              aria-label={`${reaction.label}`}
            >
              {/* Emoji button - glassmorphism + hover glow */}
              <div
                className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.06] text-xl backdrop-blur-xl transition-all duration-300 group-hover:border-white/[0.2] group-hover:bg-white/[0.1] group-hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] group-active:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                style={{
                  boxShadow:
                    activeEmoji === reaction.emoji
                      ? `0 0 20px ${reaction.color}50, 0 0 35px ${reaction.color}25, 0 0 15px rgba(255,255,255,0.3)`
                      : undefined,
                  transition: "box-shadow 0.3s, background 0.3s, border-color 0.3s",
                }}
              >
                <span
                  className="transition-transform duration-300"
                  style={{
                    transform:
                      activeEmoji === reaction.emoji ? "scale(1.25)" : "scale(1)",
                  }}
                >
                  {reaction.emoji}
                </span>

                {/* Glow ring on active */}
                <div
                  className="absolute inset-0 rounded-2xl transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, ${reaction.color}20 0%, transparent 70%)`,
                    opacity: activeEmoji === reaction.emoji ? 1 : 0,
                  }}
                />
              </div>

              {/* Count */}
              <span
                className="text-[10px] tracking-wider text-[#94A3B8] transition-colors duration-300 group-hover:text-[#E2E8F0]"
                style={{ fontFamily: "var(--font-oswald)" }}
              >
                {counts[reaction.emoji]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
