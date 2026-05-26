import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { HourlyScore } from '../api/client'

interface Props {
  scores: HourlyScore[]
  mentalPeakHour: number
  physicalPeakHour: number
  currentHour?: number
}

function fmtHour(h: number): string {
  if (h === 0) return '12a'
  if (h < 12) return `${h}a`
  if (h === 12) return '12p'
  return `${h - 12}p`
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const mental = payload.find((p: any) => p.dataKey === 'mental')?.value
  const physical = payload.find((p: any) => p.dataKey === 'physical')?.value
  const combined = payload.find((p: any) => p.dataKey === 'combined')?.value
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <div className="font-semibold text-white mb-2">{fmtHour(label)} — {label}:00</div>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-violet">Mental</span>
          <span className="text-white font-mono">{mental?.toFixed(0)}/100</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-cyan">Physical</span>
          <span className="text-white font-mono">{physical?.toFixed(0)}/100</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-border">
          <span className="text-muted">Combined</span>
          <span className="text-white font-mono">{combined?.toFixed(0)}/100</span>
        </div>
      </div>
    </div>
  )
}

export default function PeakWindowChart({ scores, mentalPeakHour, physicalPeakHour, currentHour }: Props) {
  const now = currentHour ?? new Date().getHours()

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={scores} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="mentalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7b2fff" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7b2fff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="physicalGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f5d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00f5d4" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis
            dataKey="hour"
            tickFormatter={fmtHour}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={{ stroke: '#1e1e2e' }}
            tickLine={false}
            interval={2}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Current time */}
          <ReferenceLine
            x={now}
            stroke="#ffffff30"
            strokeDasharray="4 4"
            label={{ value: 'Now', fill: '#6b7280', fontSize: 10, position: 'top' }}
          />

          {/* Mental peak */}
          <ReferenceLine
            x={mentalPeakHour}
            stroke="#7b2fff"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            label={{ value: '⚡ Focus', fill: '#7b2fff', fontSize: 10, position: 'insideTopRight' }}
          />

          {/* Physical peak */}
          <ReferenceLine
            x={physicalPeakHour}
            stroke="#00f5d4"
            strokeWidth={1.5}
            strokeDasharray="6 3"
            label={{ value: '💪 Gym', fill: '#00f5d4', fontSize: 10, position: 'insideTopLeft' }}
          />

          <Area
            type="monotone"
            dataKey="mental"
            stroke="#7b2fff"
            strokeWidth={2}
            fill="url(#mentalGrad)"
            name="Mental"
          />
          <Area
            type="monotone"
            dataKey="physical"
            stroke="#00f5d4"
            strokeWidth={2}
            fill="url(#physicalGrad)"
            name="Physical"
          />

          <Legend
            wrapperStyle={{ paddingTop: '8px' }}
            formatter={(value) => (
              <span style={{ color: value === 'Mental' ? '#7b2fff' : '#00f5d4', fontSize: 12 }}>
                {value}
              </span>
            )}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
