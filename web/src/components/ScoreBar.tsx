interface ScoreBarProps {
  score: number
}

export function ScoreBar({ score }: ScoreBarProps) {
  const color =
    score >= 80 ? 'bg-green-500' :
    score >= 50 ? 'bg-yellow-500' :
    'bg-red-500'

  const textColor =
    score >= 80 ? 'text-green-400' :
    score >= 50 ? 'text-yellow-400' :
    'text-red-400'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={`text-sm font-bold w-8 text-right ${textColor}`}>
        {score}
      </span>
    </div>
  )
}
