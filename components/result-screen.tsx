"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
  useMotionValueEvent,
  type Variants,
} from "framer-motion";

// --- 型 ---
export type ResultEntry = {
  rank: 1 | 2 | 3;
  answer: string;
  votes: number;
  authorName: string;
  authorIcon?: string; // 将来 Avatar URL など
};

const MOCK_RESULTS: ResultEntry[] = [
  { rank: 1, answer: "一番人気の答え", votes: 5, authorName: "田中", authorIcon: undefined },
  { rank: 2, answer: "二番目の答え", votes: 3, authorName: "佐藤", authorIcon: undefined },
  { rank: 3, answer: "三番目の答え", votes: 2, authorName: "鈴木", authorIcon: undefined },
];

export type ResultStep = "analyzing" | "revealing_lowers" | "suspense" | "climax";

export interface ResultScreenProps {
  /** 実ゲーム用: 1位〜3位の結果。未指定時はモックデータを使用 */
  results?: ResultEntry[];
  /** クライマックス後に表示するフッター（例: 次のラウンドボタン） */
  footer?: ReactNode;
}

// --- 票数カウントアップ表示（useSpring + useTransform）---
function AnimatedVoteCount({ votes, isActive }: { votes: number; isActive: boolean }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [displayCount, setDisplayCount] = useState(0);

  useMotionValueEvent(display, "change", (v) => setDisplayCount(v));

  useEffect(() => {
    if (isActive) spring.set(votes);
  }, [isActive, votes, spring]);

  return <span>{displayCount}</span>;
}

// --- 1位カード用 3D フリップ ---
const cardFlipVariants: Variants = {
  back: { rotateY: 0 },
  front: { rotateY: 180 },
};

// Step 1: 集計中のサスペンス（心拍パルス）— モジュールスコープで再生成を防ぐ
const pulseVariants: Variants = {
  pulse: {
    scale: [1, 1.08, 1],
    transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
  },
};

// Step 2: 下位カード用 コンテナ（staggerChildren）
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.35, delayChildren: 0.1 },
  },
};

const lowerCardVariants: Variants = {
  hidden: { opacity: 0, y: 60, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// Step 3: 1位プレースホルダー（グロー＋小刻み震え）
const placeholderShakeVariants: Variants = {
  idle: {
    x: [0, -2, 2, -1, 1, 0],
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 0.3 },
  },
};

// Step 4: 1位カード 裏返し＋作者バーン
const flipTransition = { type: "spring" as const, stiffness: 120, damping: 18 };
const authorRevealVariants: Variants = {
  hidden: { scale: 0.5, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

const lowerAuthorRevealVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
};

// --- メインコンポーネント ---
export function ResultScreen({ results: resultsProp, footer }: ResultScreenProps = {}) {
  const results = resultsProp?.length ? resultsProp : MOCK_RESULTS;
  const [step, setStep] = useState<ResultStep>("analyzing");
  const [showFlash, setShowFlash] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  // タイムライン: 0s → analyzing, 2s → revealing_lowers, 5s → suspense, 7.5s → climax
  useEffect(() => {
    const t1 = setTimeout(() => setStep("revealing_lowers"), 2000);
    const t2 = setTimeout(() => setStep("suspense"), 5000);
    const t3 = setTimeout(() => {
      setStep("climax");
      setShowFlash(true);
    }, 7500);
    const t4 = setTimeout(() => setShowFlash(false), 7800);
    const t5 = setTimeout(() => setShowFooter(true), 9500); // クライマックス約2秒後にフッター表示
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const first = results[0];
  const lowers = results.slice(1).reverse(); // 3位 → 2位の順で表示

  // 結果が0件の場合は簡易メッセージ（通常は closeup では発生しない）
  if (!first) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#0F172A] px-5">
        <p className="text-[#94A3B8]">結果がありません</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#0F172A]">
      {/* 他画面と同様のオーロラ基調＋緊張感のある色変化の激しい演出 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0F172A 0%, #0f1f2e 25%, #0d2838 50%, #1e1b4b 75%, #134e4a 90%, #115e59 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-1/2 -left-1/3 h-[180%] w-[180%] opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 20%, rgba(129, 140, 248, 0.5) 0%, rgba(79, 70, 229, 0.25) 35%, transparent 60%), radial-gradient(ellipse 60% 70% at 75% 40%, rgba(52, 211, 153, 0.45) 0%, rgba(20, 184, 166, 0.2) 40%, transparent 65%), radial-gradient(ellipse 50% 50% at 50% 85%, rgba(244, 63, 94, 0.18) 0%, transparent 55%)",
          backgroundSize: "200% 200%",
          animation: "aurora-tense-1 6s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute -top-1/3 -right-1/4 h-[150%] w-[150%] opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(34, 211, 238, 0.35) 0%, transparent 50%), radial-gradient(ellipse at 20% 75%, rgba(129, 140, 248, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(251, 191, 36, 0.12) 0%, transparent 45%)",
          backgroundSize: "200% 200%",
          animation: "aurora-tense-2 5s ease-in-out infinite",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, rgba(15, 23, 42, 0.4) 100%)",
        }}
      />

      {/* Step 3 用 暗転オーバーレイ */}
      <AnimatePresence>
        {(step === "suspense" || step === "climax") ? (
          <motion.div
            className="pointer-events-none fixed inset-0 z-10 bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: step === "suspense" ? 0.5 : 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        ) : null}
      </AnimatePresence>

      {/* Step 4 用 フラッシュ（白い閃光） */}
      <AnimatePresence>
        {showFlash ? (
          <motion.div
            className="pointer-events-none fixed inset-0 z-30 bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.95 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
          />
        ) : null}
      </AnimatePresence>

      <div className="relative z-20 flex min-h-dvh flex-col items-center justify-center px-5 py-14">
        {/* ========== Step 1: 集計中 ========== */}
        <AnimatePresence mode="wait">
          {step === "analyzing" ? (
            <motion.div
              key="analyzing"
              className="flex flex-col items-center gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                variants={pulseVariants}
                animate="pulse"
                className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#818CF8]/40 bg-[#818CF8]/10"
              >
                <span className="text-4xl opacity-80">🔍</span>
              </motion.div>
              <div className="text-center">
                <p
                  className="text-lg font-medium text-[#E2E8F0]"
                  style={{ fontFamily: "var(--font-playfair)" }}
                >
                  集計中...
                </p>
                <p className="mt-1 text-sm text-[#94A3B8]">Analyzing Secrets...</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* ========== Step 2 & 3 & 4: カードエリア ========== */}
        {(step === "revealing_lowers" || step === "suspense" || step === "climax") ? (
          <div className="flex w-full max-w-md flex-col items-center gap-4">
            {/* 下位（3位・2位）カード */}
            <motion.div
              className="flex w-full flex-col gap-3"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {lowers.map((entry) => (
                <motion.div
                  key={entry.rank}
                  variants={lowerCardVariants}
                  className="rounded-2xl border border-white/8 bg-white/6 p-4 backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span
                        className="mb-1 block font-mono text-xs tracking-widest text-[#818CF8]/60"
                        style={{ fontFamily: "var(--font-oswald)" }}
                      >
                        #{String(entry.rank).padStart(2, "0")}
                      </span>
                      <p className="font-sans text-[15px] leading-relaxed text-[#E2E8F0]">
                        {entry.answer}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-[#818CF8]">
                          <AnimatedVoteCount
                            votes={entry.votes}
                            isActive
                          />
                        </span>
                        <span className="text-[13px] text-[#94A3B8]">票</span>
                      </div>
                      {/* 犯人：climax で一斉表示 */}
                      <AnimatePresence>
                        {step === "climax" ? (
                          <motion.div
                            variants={lowerAuthorRevealVariants}
                            initial="hidden"
                            animate="visible"
                            className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#818CF8]/20 text-sm font-medium text-[#C7D2FE]">
                              ?
                            </span>
                            <span className="text-sm text-[#94A3B8]">書いた人</span>
                            <span
                              className="font-medium text-[#E2E8F0]"
                              style={{ fontFamily: "var(--font-playfair)" }}
                            >
                              {entry.authorName}
                            </span>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                    {/* 下位は Step 2〜suspense の間はシルエット */}
                    {step !== "climax" ? (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg text-[#64748B]">
                        ?
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* ========== 1位エリア ========== */}
            {/* Step 3: プレースホルダー（グロー＋震え） */}
            {step === "suspense" ? (
              <motion.div
                key="first-placeholder"
                variants={placeholderShakeVariants}
                animate="idle"
                className="flex w-full justify-center"
              >
                <div
                  className="relative rounded-2xl border-2 border-[#818CF8]/50 bg-[#818CF8]/10 px-8 py-6 shadow-[0_0_40px_rgba(129,140,248,0.25)]"
                  style={{ minWidth: 280 }}
                >
                  <span
                    className="block text-center font-mono text-xs tracking-widest text-[#818CF8]/70"
                    style={{ fontFamily: "var(--font-oswald)" }}
                  >
                    #01
                  </span>
                  <p className="mt-2 text-center text-[#94A3B8]">???</p>
                  <p className="mt-1 text-center text-sm text-[#64748B]">1位を発表...</p>
                </div>
              </motion.div>
            ) : null}

            {/* Step 4: 1位カード 3D フリップ＋作者バーン */}
            {step === "climax" ? (
              <motion.div
                key="first-reveal"
                className="perspective-1000 w-full"
                style={{ perspective: 1000 }}
              >
                <motion.div
                  className="relative rounded-2xl border-2 border-[#34D399]/50 bg-white/8 p-5 shadow-[0_0_30px_rgba(52,211,153,0.2)]"
                  initial={{ rotateY: 90, opacity: 0.6 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  transition={flipTransition}
                  style={{ transformStyle: "preserve-3d", transformOrigin: "center center" }}
                >
                  <span
                    className="mb-2 block font-mono text-xs tracking-widest text-[#34D399]"
                    style={{ fontFamily: "var(--font-oswald)" }}
                  >
                    #01 １位
                  </span>
                  <p
                    className="text-lg font-medium leading-relaxed text-[#E2E8F0]"
                    style={{ fontFamily: "var(--font-playfair)" }}
                  >
                    {first.answer}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-medium text-[#34D399]">
                      <AnimatedVoteCount votes={first.votes} isActive={true} />
                    </span>
                    <span className="text-[13px] text-[#94A3B8]">票</span>
                  </div>
                  {/* 犯人バーン表示 */}
                  <motion.div
                    variants={authorRevealVariants}
                    initial="hidden"
                    animate="visible"
                    className="mt-4 rounded-xl border border-[#34D399]/30 bg-[#34D399]/10 px-4 py-3"
                  >
                    <p className="text-xs text-[#94A3B8]">回答した人</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#34D399]/30 text-xl font-bold text-[#34D399]">
                        {first.authorName.slice(0, 1)}
                      </span>
                      <span
                        className="text-xl font-semibold text-[#E2E8F0]"
                        style={{ fontFamily: "var(--font-playfair)" }}
                      >
                        {first.authorName}
                      </span>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : null}
          </div>
        ) : null}

        {/* クライマックス後に表示するフッター（ゲーム用: 次のラウンド等） */}
        {footer ? (
          <motion.div
            className="mt-8 w-full max-w-md"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: showFooter ? 1 : 0, y: showFooter ? 0 : 12 }}
            transition={{ duration: 0.4 }}
          >
            {footer}
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
