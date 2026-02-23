interface QuestionHeaderProps {
  question: string
}

export function QuestionHeader({ question }: QuestionHeaderProps) {
  return (
    <header className="relative px-5 pt-14 pb-6">
      {/* Decorative line */}
      <div className="mb-5 h-px bg-linear-to-r from-transparent via-[#818CF8]/30 to-transparent" />

      {/* Question text */}
      <h1
        className="text-balance text-2xl leading-snug tracking-tight text-[#F1F5F9]"
        style={{ fontFamily: 'var(--font-playfair)' }}
      >
        {question}
      </h1>

      {/* Answer count badge */}
      <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1.5 backdrop-blur-sm">
        <div className="h-1.5 w-1.5 rounded-full bg-[#818CF8]" />
        <span className="text-xs text-[#94A3B8]">
          {'全員の回答が揃いました'}
        </span>
      </div>
    </header>
  )
}
