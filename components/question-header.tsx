interface QuestionHeaderProps {
  question: string
  roundNumber: number
  totalPlayers: number
}

export function QuestionHeader({
  question,
  roundNumber,
  totalPlayers,
}: QuestionHeaderProps) {
  return (
    <header className="relative px-5 pt-14 pb-6">
      {/* Top meta row */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#34D399]" />
          <span className="text-xs tracking-wider text-[#34D399]/80">LIVE</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
          <span style={{ fontFamily: 'var(--font-oswald)' }}>
            {'ROUND '}
            <span className="text-[#818CF8]">{roundNumber}</span>
          </span>
          <span className="text-white/20">{'|'}</span>
          <span style={{ fontFamily: 'var(--font-oswald)' }}>
            <span className="text-[#818CF8]">{totalPlayers}</span>
            {' PLAYERS'}
          </span>
        </div>
      </div>

      {/* Decorative line */}
      <div className="mb-5 h-px bg-gradient-to-r from-transparent via-[#818CF8]/30 to-transparent" />

      {/* Question text */}
      <h1
        className="text-balance text-2xl leading-snug tracking-tight text-[#F1F5F9]"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {question}
      </h1>

      {/* Answer count badge */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 backdrop-blur-sm">
        <div className="h-1.5 w-1.5 rounded-full bg-[#818CF8]" />
        <span className="text-xs text-[#94A3B8]">
          {'全員の回答が揃いました'}
        </span>
      </div>
    </header>
  )
}
