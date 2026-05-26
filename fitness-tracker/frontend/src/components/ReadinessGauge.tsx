interface Props {
  score: number
  label: string
  size?: 'sm' | 'lg'
}

const LABEL_COLORS: Record<string, string> = {
  Peak: '#00f5d4',
  High: '#7b2fff',
  Moderate: '#ffd60a',
  Low: '#ff6b35',
  'Recovery Day': '#ef233c',
}

export default function ReadinessGauge({ score, label, size = 'lg' }: Props) {
  const color = LABEL_COLORS[label] || '#00f5d4'
  const r = size === 'lg' ? 52 : 36
  const cx = size === 'lg' ? 64 : 44
  const cy = size === 'lg' ? 64 : 44
  const stroke = size === 'lg' ? 8 : 6
  const circumference = 2 * Math.PI * r
  // Show 270 degrees of arc (top-left to bottom-right, going clockwise)
  const arcLen = circumference * 0.75
  const filled = arcLen * (score / 100)

  const dim = size === 'lg' ? 128 : 88

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="-rotate-[225deg]">
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#1e1e2e"
            strokeWidth={stroke}
            strokeDasharray={`${arcLen} ${circumference - arcLen}`}
            strokeLinecap="round"
          />
          {/* Value */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color}60)`,
              transition: 'stroke-dasharray 0.5s ease-out',
            }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingBottom: size === 'lg' ? 4 : 2 }}
        >
          <span
            className={`font-bold tabular-nums leading-none ${size === 'lg' ? 'text-3xl' : 'text-xl'}`}
            style={{ color }}
          >
            {score.toFixed(0)}
          </span>
          <span className="text-xs text-muted mt-0.5">/100</span>
        </div>
      </div>
      <div>
        <span
          className={`font-semibold ${size === 'lg' ? 'text-base' : 'text-sm'}`}
          style={{ color }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
