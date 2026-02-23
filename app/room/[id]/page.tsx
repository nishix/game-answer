"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuroraBackground } from "@/components/aurora-background";
import { QuestionHeader } from "@/components/question-header";
import { AnswerCard } from "@/components/answer-card";
import { ReactionBar } from "@/components/reaction-bar";
import { FloatingEmojis } from "@/components/floating-emojis";
import { useGameStore, type RoomPhase } from "@/lib/store/gameStore";
import { GameRealtimeProvider } from "@/lib/contexts/GameRealtimeContext";
import { updateRoomStatus, getRoom, resolveRoom, getPlayersByRoom } from "@/lib/supabase/rooms";
import { submitAnswer, getAnswersByRoom, deleteAnswersByRoom } from "@/lib/supabase/answers";
import { submitVote, getVotesByRoom, deleteVotesByRoom } from "@/lib/supabase/votes";
import { pickFirstQuestion, pickRandomQuestion } from "@/lib/questions";
import { ResultScreen, type ResultEntry } from "@/components/result-screen";
import { HelpModal } from "@/components/help-modal";

function LobbyPlaceholder({
  roomId,
  shortCode,
  players,
  isHost,
}: {
  roomId: string;
  /** 参加コード（10桁）。表示・コピー用。なければ roomId を表示 */
  shortCode: string | null;
  players: { id: string; name: string; is_host: boolean }[];
  isHost: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setRoomStatus = useGameStore((s) => s.setRoomStatus);
  const setAnswers = useGameStore((s) => s.setAnswers);
  const setVotes = useGameStore((s) => s.setVotes);

  const handleStart = async () => {
    setError(null);
    setLoading(true);
    const picked = await pickFirstQuestion();
    if (!picked) {
      setError("お題がありません。public/answer/questions.json を確認してください。");
      setLoading(false);
      return;
    }
    const result = await updateRoomStatus(
      roomId,
      "question",
      picked.text,
      [picked.id]
    );
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setRoomStatus("question", picked.text);
    setAnswers([]);
    setVotes([]);
    deleteAnswersByRoom(roomId).catch(() => {});
    deleteVotesByRoom(roomId).catch(() => {});
    setLoading(false);
  };

  const displayCode = shortCode ?? roomId;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select and show
    }
  };

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-4 pb-20">
      <h1
        className="mb-6 text-xl font-medium text-[#F1F5F9]"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        ロビー
      </h1>

      {/* 参加コード（表示とコピーは同じルームID） */}
      <div className="mb-8">
        <p className="mb-2 text-xs tracking-wider text-[#818CF8]/80" style={{ fontFamily: "var(--font-oswald)" }}>
          参加コード
        </p>
        <div className="flex items-center gap-3">
          <code className="flex-1 break-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm tracking-widest text-[#E2E8F0]">
            {displayCode}
          </code>
          <button
            type="button"
            onClick={handleCopyCode}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-[#E2E8F0] transition-colors hover:bg-white/10"
          >
            {copied ? "コピーしました" : "コピー"}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-[#64748B]">
          参加者にこのコードを共有してください（10桁）。コピーしたコードをそのまま参加画面で入力すると部屋に入れます。
        </p>
      </div>

      {/* プレイヤー一覧 */}
      <div className="mb-8">
        <p className="mb-3 text-xs tracking-wider text-[#818CF8]/80" style={{ fontFamily: "var(--font-oswald)" }}>
          参加者 ({players.length}人)
        </p>
        <ul className="space-y-2">
          {players.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <span className="font-medium text-[#E2E8F0]">{p.name}</span>
              {p.is_host ? (
                <span className="rounded bg-[#818CF8]/20 px-2 py-0.5 text-xs text-[#818CF8]">ホスト</span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      {isHost ? (
        <div className="mt-auto space-y-3">
          {error ? (
            <p className="text-sm text-[#F43F5E]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleStart}
            disabled={loading}
            className="glass-button-primary w-full rounded-xl px-6 py-3 font-medium transition-all duration-200 hover:opacity-95 disabled:opacity-50"
          >
            {loading ? "進行中…" : "ゲーム開始"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function QuestionView({
  roomId,
  myPlayerId,
  question,
  isHost,
}: {
  roomId: string;
  myPlayerId: string | null;
  question: string;
  isHost: boolean;
}) {
  const [answer, setAnswer] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = answer.trim();
    if (!content || !myPlayerId) return;
    setSubmitLoading(true);
    const result = await submitAnswer(roomId, myPlayerId, content);
    setSubmitLoading(false);
    if (!result.error) setSubmitted(true);
  };

  return (
    <div className="flex min-h-dvh flex-col px-5 pt-4 pb-20">
      <h1
        className="text-glow mb-8 font-serif text-2xl leading-snug text-white md:text-3xl"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
      >
        {question || "お題"}
      </h1>
      {myPlayerId ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <textarea
            placeholder="あなたの回答を入力"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={submitted}
            rows={4}
            className="glass-input w-full resize-none rounded-3xl px-4 py-3.5 text-[#E2E8F0] placeholder:text-[#64748B] transition-[border-color,box-shadow] disabled:opacity-60"
          />
          {!submitted ? (
            <button
              type="submit"
              disabled={submitLoading || !answer.trim()}
              className="glass-button-primary rounded-3xl px-4 py-3.5 font-medium transition-all duration-200 disabled:opacity-50 disabled:transform-none"
            >
              {submitLoading ? "送信中…" : "送信"}
            </button>
          ) : (
            <p className="text-sm text-[#94E6C4]/90">回答を送信しました。全員の回答が揃うと自動で結果が表示されます</p>
          )}
        </form>
      ) : null}
    </div>
  );
}

function ResultView({
  roomId,
  isHost,
  playerCount,
  answerCount,
}: {
  roomId: string;
  isHost: boolean;
  playerCount: number;
  answerCount: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setRoomStatus = useGameStore((s) => s.setRoomStatus);

  const handleToLobby = async () => {
    setError(null);
    setLoading(true);
    const result = await updateRoomStatus(roomId, "lobby");
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setRoomStatus("lobby");
    setLoading(false);
  };
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <p
        className="mb-2 text-2xl font-medium text-[#F1F5F9]"
        style={{ fontFamily: "var(--font-playfair)" }}
      >
        おつかれさま！
      </p>
      <p className="mb-8 text-[#94A3B8]">また遊んでね</p>
      <div className="mb-8 flex gap-6 text-sm text-[#94A3B8]">
        <span>参加 {playerCount} 人</span>
        <span>回答 {answerCount} 件</span>
      </div>
      {isHost ? (
        <div className="space-y-2">
          {error ? (
            <p className="text-sm text-[#F43F5E]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            onClick={handleToLobby}
            disabled={loading}
            className="rounded-xl bg-[#818CF8] px-8 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "進行中…" : "ロビーに戻る"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CloseupView({
  roomId,
  isHost,
  question,
  answers,
  votes,
  players,
}: {
  roomId: string;
  isHost: boolean;
  question: string;
  answers: { id: string; room_id: string; player_id: string; content: string }[];
  votes: { answer_id: string; player_id: string }[];
  players: { id: string; name: string; is_host: boolean }[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setRoomStatus = useGameStore((s) => s.setRoomStatus);
  const setAnswers = useGameStore((s) => s.setAnswers);
  const setVotes = useGameStore((s) => s.setVotes);

  // 票数でソートし、1位〜3位を ResultEntry に変換
  const voteCountByAnswer = votes.reduce<Record<string, number>>((acc, v) => {
    acc[v.answer_id] = (acc[v.answer_id] ?? 0) + 1;
    return acc;
  }, {});
  const rankedAnswers = [...answers]
    .sort((a, b) => (voteCountByAnswer[b.id] ?? 0) - (voteCountByAnswer[a.id] ?? 0))
    .slice(0, 3);
  const rankedResults: ResultEntry[] = rankedAnswers.map((a, index) => ({
    rank: (index + 1) as 1 | 2 | 3,
    answer: a.content,
    votes: voteCountByAnswer[a.id] ?? 0,
    authorName: players.find((p) => p.id === a.player_id)?.name ?? "?",
    authorIcon: undefined,
  }));

  const handleNextRound = async () => {
    setError(null);
    setLoading(true);
    const room = await getRoom(roomId);
    if (!room) {
      setError("ルームを取得できません");
      setLoading(false);
      return;
    }
    const used = Array.isArray(room.used_question_indices)
      ? room.used_question_indices
      : [];
    const next = await pickRandomQuestion(used);
    if (!next) {
      const result = await updateRoomStatus(roomId, "result");
      if (result.error) setError(result.error);
      else setRoomStatus("result");
      setLoading(false);
      return;
    }
    const result = await updateRoomStatus(
      roomId,
      "question",
      next.text,
      [...used, next.id]
    );
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setRoomStatus("question", next.text);
    setAnswers([]);
    setVotes([]);
    deleteAnswersByRoom(roomId).catch(() => {});
    deleteVotesByRoom(roomId).catch(() => {});
    setLoading(false);
  };

  return (
    <ResultScreen
      results={rankedResults}
      footer={
        isHost ? (
          <div className="space-y-2">
            {error ? (
              <p className="text-center text-sm text-[#F43F5E]" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              onClick={handleNextRound}
              disabled={loading}
              className="glass-button-primary w-full rounded-xl px-8 py-3 font-medium transition-all duration-200 hover:opacity-95 disabled:opacity-50"
            >
              {loading ? "進行中…" : "次のラウンド"}
            </button>
          </div>
        ) : undefined
      }
    />
  );
}

function ExposureView({
  roomId,
  question,
  answers,
  totalPlayers,
  myPlayerId,
  votes,
  onVote,
}: {
  roomId: string;
  question: string;
  answers: { id: string; room_id: string; player_id: string; content: string }[];
  totalPlayers: number;
  myPlayerId: string | null;
  votes: { answer_id: string; player_id: string }[];
  onVote: (answerId: string) => void;
}) {
  return (
    <>
      <QuestionHeader question={question || "お題"} />
      <div className="flex-1 overflow-y-auto px-5 pb-40">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-[#818CF8]/20 to-transparent" />
          <span
            className="text-[10px] tracking-[0.25em] text-[#818CF8]/50"
            style={{ fontFamily: "var(--font-oswald)" }}
          >
            投票してください（1人1票・付け替え可）
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-[#818CF8]/20 to-transparent" />
        </div>
        <div className="flex flex-col gap-3">
          {answers.map((answer, index) => {
            const voteCount = votes.filter((v) => v.answer_id === answer.id).length;
            const hasVoted = Boolean(
              myPlayerId && votes.some((v) => v.player_id === myPlayerId && v.answer_id === answer.id)
            );
            return (
              <AnswerCard
                key={answer.id}
                answer={answer.content}
                index={index}
                answerId={answer.id}
                onVote={onVote}
                voteCount={voteCount}
                hasVoted={hasVoted}
                showVoteCount={false}
              />
            );
          })}
        </div>
      </div>
      <FloatingEmojis />
      <ReactionBar roomId={roomId} />
    </>
  );
}

export default function RoomPage() {
  const params = useParams();
  const idOrShortCode = typeof params?.id === "string" ? params.id.trim() : null;

  const roomId = useGameStore((s) => s.roomId);
  const shortCode = useGameStore((s) => s.shortCode);
  const phase = useGameStore((s) => s.phase);
  const currentQuestion = useGameStore((s) => s.currentQuestion);
  const answers = useGameStore((s) => s.answers);
  const votes = useGameStore((s) => s.votes);
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const setRoom = useGameStore((s) => s.setRoom);
  const setShortCode = useGameStore((s) => s.setShortCode);
  const setRoomStatus = useGameStore((s) => s.setRoomStatus);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const setAnswers = useGameStore((s) => s.setAnswers);
  const setVotes = useGameStore((s) => s.setVotes);
  const resetGame = useGameStore((s) => s.resetGame);

  const router = useRouter();
  const [resolveError, setResolveError] = useState(false);
  const [resolving, setResolving] = useState(true);
  const [copied, setCopied] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const displayCode = shortCode ?? roomId ?? "—";
  const handleCopyCode = useCallback(async () => {
    if (!displayCode || displayCode === "—") return;
    try {
      await navigator.clipboard.writeText(displayCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback */
    }
  }, [displayCode]);

  const isHost = Boolean(
    myPlayerId && players.find((p) => p.id === myPlayerId)?.is_host
  );

  // タブ閉じ・リロード時も退室する（sendBeacon で確実に送る）。フックの順序を守るため早期 return より前に定義
  const leaveRef = useRef({ roomId: null as string | null, playerId: null as string | null });
  leaveRef.current.roomId = roomId ?? null;
  leaveRef.current.playerId = myPlayerId ?? null;
  useEffect(() => {
    const sendLeaveBeacon = () => {
      const { roomId: r, playerId: p } = leaveRef.current;
      if (r && p && typeof navigator.sendBeacon === "function") {
        const body = JSON.stringify({ roomId: r, playerId: p });
        const url = typeof window !== "undefined" ? `${window.location.origin}/api/leave` : "/api/leave";
        navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      }
    };
    window.addEventListener("pagehide", sendLeaveBeacon);
    window.addEventListener("beforeunload", sendLeaveBeacon);
    return () => {
      window.removeEventListener("pagehide", sendLeaveBeacon);
      window.removeEventListener("beforeunload", sendLeaveBeacon);
    };
  }, []);

  // ? キーでヘルプモーダルを開閉（入力中は無視）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "?" || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      const isInput = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
      if (isInput) return;
      e.preventDefault();
      setHelpOpen((open) => !open);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // resolve 成功時に phase/currentQuestion も一度セットし、getRoom の初回往復を省略（ウォーターフォール削減）
  useEffect(() => {
    if (!idOrShortCode) {
      setResolving(false);
      setResolveError(false);
      return;
    }
    setResolving(true);
    setResolveError(false);
    resolveRoom(idOrShortCode).then((room) => {
      setResolving(false);
      if (room) {
        setRoom(room.id);
        setShortCode(room.short_code ?? null);
        setRoomStatus(room.status as RoomPhase, room.current_question ?? "");
      } else {
        setRoom(null);
        setShortCode(null);
        setResolveError(true);
      }
    });
  }, [idOrShortCode, setRoom, setShortCode, setRoomStatus]);

  // Realtime で status は更新される。初回は resolve でセット済みのため、ポーリング用に getRoom は残す（任意で削除可）
  useEffect(() => {
    if (!roomId) return;
    getRoom(roomId).then((room) => {
      if (room) {
        setRoomStatus(room.status as RoomPhase, room.current_question ?? "");
      }
    });
  }, [roomId, setRoomStatus]);

  useEffect(() => {
    if (!roomId) return;
    getPlayersByRoom(roomId).then((list) => {
      setPlayers(
        list.map((p) => ({
          id: p.id,
          room_id: p.room_id,
          name: p.name,
          is_host: p.is_host,
        }))
      );
    });
  }, [roomId, setPlayers]);

  // Realtime の取りこぼし対策: プレイヤー一覧を定期的に再取得＋マウント時・タブ表示時に即再取得
  useEffect(() => {
    if (!roomId) return;
    const refetch = () => {
      getPlayersByRoom(roomId).then((list) => {
        setPlayers(
          list.map((p) => ({
            id: p.id,
            room_id: p.room_id,
            name: p.name,
            is_host: p.is_host,
          }))
        );
      });
    };
    refetch();
    const interval = setInterval(refetch, 5000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refetch);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refetch);
    };
  }, [roomId, setPlayers]);

  useEffect(() => {
    if (roomId && phase === "exposure") {
      getAnswersByRoom(roomId).then((list) => {
        setAnswers(
          list.map((r) => ({
            id: r.id,
            room_id: r.room_id,
            player_id: r.player_id,
            content: r.content,
          }))
        );
      });
      getVotesByRoom(roomId).then((list) => {
        setVotes(
          list.map((v) => ({
            id: v.id,
            room_id: v.room_id,
            player_id: v.player_id,
            answer_id: v.answer_id,
          }))
        );
      });
    }
  }, [roomId, phase, setAnswers, setVotes]);

  if (!idOrShortCode) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-[#94A3B8]">参加コードがありません</p>
      </main>
    );
  }
  if (resolving) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-[#94A3B8]">読み込み中…</p>
      </main>
    );
  }
  if (resolveError || !roomId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-[#94A3B8]">ルームが見つかりません</p>
      </main>
    );
  }

  const phaseUI: Record<RoomPhase, React.ReactNode> = {
    lobby: (
      <LobbyPlaceholder
        roomId={roomId}
        shortCode={shortCode}
        players={players}
        isHost={isHost}
      />
    ),
    question: (
      <QuestionView
        roomId={roomId}
        myPlayerId={myPlayerId}
        question={currentQuestion}
        isHost={isHost}
      />
    ),
    exposure: (
      <ExposureView
        roomId={roomId}
        question={currentQuestion}
        answers={answers}
        totalPlayers={players.length || 1}
        myPlayerId={myPlayerId}
        votes={votes}
        onVote={(answerId) => {
          if (myPlayerId) submitVote(roomId, myPlayerId, answerId);
        }}
      />
    ),
    closeup: (
      <CloseupView
        roomId={roomId}
        isHost={isHost}
        question={currentQuestion}
        answers={answers}
        votes={votes}
        players={players}
      />
    ),
    result: (
      <ResultView
        roomId={roomId}
        isHost={isHost}
        playerCount={players.length}
        answerCount={answers.length}
      />
    ),
  };

  const handleLeaveRoom = async () => {
    if (!roomId || !myPlayerId || leaving) return;
    setLeaveError(null);
    setLeaving(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, playerId: myPlayerId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok || data.error) {
        setLeaveError(data.error ?? "退室に失敗しました");
        setLeaving(false);
        return;
      }
    } catch {
      setLeaveError("退室に失敗しました");
      setLeaving(false);
      return;
    }
    resetGame();
    router.push("/");
  };

  return (
    <main className="noise-overlay relative min-h-dvh">
      <AuroraBackground />
      <GameRealtimeProvider roomId={roomId}>
        {/* 参加コード・参加者一覧（全フェーズで表示）。スマホでは2段に分け、?・退室が質問と被らないようにする */}
        <header className="absolute left-4 right-4 top-4 z-20 space-y-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:space-y-0 sm:gap-2">
        <div className="glass-button-subtle flex min-w-0 flex-1 flex-wrap items-center gap-1.5 rounded-xl px-3 py-2">
          <span className="shrink-0 text-xs font-medium text-white/70">参加者 ({players.length}人)</span>
          <span className="flex flex-wrap gap-1.5">
            {players.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center rounded-lg bg-white/10 px-2 py-0.5 text-xs text-white/90"
              >
                {p.name}
                {p.is_host ? (
                  <span className="ml-1 text-[10px] text-[#818CF8]">ホスト</span>
                ) : null}
              </span>
            ))}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center justify-between gap-2 sm:contents">
          <div className="glass-button-subtle flex shrink-0 items-center gap-2 rounded-xl px-3 py-2">
            <span className="text-xs font-medium text-white/70">参加コード</span>
            <code className="max-w-[8rem] truncate font-mono text-xs tracking-widest text-white/90" title={displayCode}>
              {displayCode}
            </code>
            <button
              type="button"
              onClick={handleCopyCode}
              className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="参加コードをコピー"
            >
              {copied ? "コピー済み" : "コピー"}
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="glass-button-subtle flex h-9 w-9 items-center justify-center rounded-xl text-base font-medium text-white/90 transition-colors hover:text-white"
              aria-label="ヘルプを開く"
              title="ヘルプ (?)"
            >
              ?
            </button>
            <div>
              {leaveError ? (
                <p className="mb-1 text-right text-[10px] text-[#F43F5E]" role="alert">
                  {leaveError}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleLeaveRoom}
                disabled={leaving}
                className="glass-button-subtle rounded-xl px-3 py-2 text-xs font-medium text-white/90 transition-colors hover:text-white disabled:opacity-50"
              >
                {leaving ? "退室中…" : "ルームを出る"}
              </button>
            </div>
          </div>
        </div>
        </header>
        <HelpModal open={helpOpen} onOpenChange={setHelpOpen} />
        <div className="relative z-10 flex min-h-dvh flex-col pt-28 sm:pt-[4.5rem]">
          {phaseUI[phase]}
        </div>
      </GameRealtimeProvider>
    </main>
  );
}
