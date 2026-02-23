"use client"

import { ThumbsUp } from "lucide-react"

interface AnswerCardProps {
  answer: string
  index: number
  answerId?: string
  onVote?: (answerId: string) => void
  voteCount?: number
  hasVoted?: boolean
  /** 投票数を表示するか（false のときは投票中でも数を見せず、結果発表で驚きを残す） */
  showVoteCount?: boolean
}

export function AnswerCard({
  answer,
  index,
  answerId,
  onVote,
  voteCount = 0,
  hasVoted = false,
  showVoteCount = true,
}: AnswerCardProps) {
  const showVote = onVote != null && answerId != null

  return (
    <div
      className="group relative rounded-2xl border border-white/[0.08] bg-white/[0.06] p-5 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.09]"
      style={{
        animation: `card-reveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.12}s both`,
      }}
    >
      {/* Subtle gradient shine on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#818CF8]/[0.05] via-transparent to-[#34D399]/[0.05] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Card number */}
      <span
        className="mb-2 block font-mono text-xs tracking-widest text-[#818CF8]/60"
        style={{ fontFamily: 'var(--font-oswald)' }}
      >
        {'#'}{String(index + 1).padStart(2, '0')}
      </span>

      {/* Answer text */}
      <p className="relative font-sans text-[15px] leading-relaxed text-[#E2E8F0]">
        {answer}
      </p>

      {/* Vote button and count */}
      {showVote ? (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVote(answerId)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-[#E2E8F0] transition-colors hover:bg-white/10 hover:border-[#818CF8]/40"
            aria-label={hasVoted ? "投票済み（別の回答に付け替え可）" : "この回答に投票"}
          >
            <ThumbsUp
              className={`h-4 w-4 ${hasVoted ? "fill-[#818CF8] text-[#818CF8]" : "text-[#94A3B8]"}`}
            />
            {showVoteCount ? <span>{voteCount}</span> : null}
          </button>
        </div>
      ) : null}

      {/* Decorative bottom line (when no vote UI) */}
      {!showVote ? (
        <div className="mt-4 h-px w-12 bg-gradient-to-r from-[#818CF8]/30 to-transparent" />
      ) : null}
    </div>
  )
}
