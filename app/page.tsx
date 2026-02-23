"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AuroraBackground } from "@/components/aurora-background";
import { createRoom, joinRoom } from "@/lib/supabase/rooms";
import { useGameStore } from "@/lib/store/gameStore";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const router = useRouter();
  const setRoom = useGameStore((s) => s.setRoom);
  const setPlayers = useGameStore((s) => s.setPlayers);

  const fetchAndSetPlayers = useCallback(
    async (roomId: string) => {
      const supabase = createClient();
      const { data } = await supabase
        .from("players")
        .select("id, room_id, name, is_host")
        .eq("room_id", roomId);
      if (data?.length) {
        setPlayers(data as { id: string; room_id: string; name: string; is_host: boolean }[]);
      }
    },
    [setPlayers]
  );

  const [createName, setCreateName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = useCallback(async () => {
    const name = createName.trim();
    if (!name) {
      setError("名前を入力してください");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await createRoom(name);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setRoom(result.roomId, result.playerId);
    await fetchAndSetPlayers(result.roomId);
    router.push(`/room/${result.shortCode}`);
  }, [createName, setRoom, router, fetchAndSetPlayers]);

  const handleJoinRoom = useCallback(async () => {
    const code = joinCode.trim();
    const name = joinName.trim();
    if (!code || !name) {
      setError("ルームコードと名前を入力してください");
      return;
    }
    setError(null);
    setLoading(true);
    const result = await joinRoom(code, name);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setRoom(result.roomId, result.playerId);
    await fetchAndSetPlayers(result.roomId);
    router.push(`/room/${result.shortCode}`);
  }, [joinCode, joinName, setRoom, router, fetchAndSetPlayers]);

  return (
    <main className="noise-overlay relative min-h-dvh">
      <AuroraBackground />
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <h1
          className="mb-10 text-center text-2xl font-medium tracking-tight text-[#F1F5F9]"
          style={{ fontFamily: "var(--font-playfair)" }}
        >
          Secret Answers
        </h1>

        {/* ルームを作る */}
        <section className="mb-10 w-full max-w-sm">
          <h2 className="mb-3 text-xs tracking-wider text-[#818CF8]/80" style={{ fontFamily: "var(--font-oswald)" }}>
            ルームを作る
          </h2>
          <input
            type="text"
            placeholder="あなたの名前"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#E2E8F0] placeholder:text-[#64748B] focus:border-[#818CF8]/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCreateRoom}
            disabled={loading}
            className="glass-button-primary w-full rounded-xl px-4 py-3 font-medium transition-all duration-200 hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "作成中…" : "ルームを作成"}
          </button>
        </section>

        {/* コードで参加 */}
        <section className="w-full max-w-sm">
          <h2 className="mb-3 text-xs tracking-wider text-[#818CF8]/80" style={{ fontFamily: "var(--font-oswald)" }}>
            コードで参加
          </h2>
          <input
            type="text"
            placeholder="参加コード（10桁）"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#E2E8F0] placeholder:text-[#64748B] focus:border-[#818CF8]/50 focus:outline-none"
          />
          <input
            type="text"
            placeholder="あなたの名前"
            value={joinName}
            onChange={(e) => setJoinName(e.target.value)}
            className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#E2E8F0] placeholder:text-[#64748B] focus:border-[#818CF8]/50 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleJoinRoom}
            disabled={loading}
            className="w-full rounded-xl border border-[#818CF8]/50 bg-white/5 px-4 py-3 font-medium text-[#E2E8F0] transition-opacity hover:bg-white/10 disabled:opacity-50"
          >
            {loading ? "参加中…" : "参加する"}
          </button>
        </section>

        {error ? (
          <p className="mt-6 text-sm text-[#F43F5E]" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
