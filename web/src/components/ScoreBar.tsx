interface ScoreBarProps {
  score: number
  showLabel?: boolean
}

export function ScoreBar({ score, showLabel = true }: ScoreBarProps) {
  const color =
    score >= 80 ? { bar: 'bg-green-400', text: 'text-green-400', glow: 'shadow-neon-sm' } :
    score >= 50 ? { bar: 'bg-yellow-400', text: 'text-yellow-400', glow: '' } :
    { bar: 'bg-red-500', text: 'text-red-400', glow: '' }

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.bar} ${color.glow}`}
          style={{ width: `${score}%` }}
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className={`text-sm font-bold font-code w-8 text-right tabular-nums ${color.text}`}>
          {score}
        </span>
      )}
    </div>
  )
}
