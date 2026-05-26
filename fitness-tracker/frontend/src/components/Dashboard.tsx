import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Zap, Dumbbell, Brain, Moon, Droplets, Activity, ChevronRight, TrendingUp, Clock, AlertTriangle } from 'lucide-react'
import { getDashboard, DashboardData } from '../api/client'
import PeakWindowChart from './PeakWindowChart'
import ReadinessGauge from './ReadinessGauge'
import { Link } from 'react-router-dom'

interface Props {
  peakOnly?: boolean
}

function fmtHour(h: number) {
  if (h === 0) return '12:00 AM'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

function MacroRing({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(1, value / target) : 0
  const r = 24, c = 2 * Math.PI * r
  const filled = c * pct
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-14 h-14">
        <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
          <circle cx="28" cy="28" r={r} fill="none" stroke="#1e1e2e" strokeWidth={5} />
          <circle
            cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={`${filled} ${c - filled}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}60)`, transition: 'stroke-dasharray 0.4s' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white">
          {value.toFixed(0)}g
        </div>
      </div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  )
}

export default function Dashboard({ peakOnly }: Props) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm text-muted">Loading your performance data...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="card text-rose text-center py-10">
        Failed to load dashboard: {error || 'Unknown error'}
      </div>
    )
  }

  const { peak_windows: pw, nutrition_summary: ns, sleep_last_night: sl, recovery_today: rec, streaks } = data

  if (peakOnly) {
    return (
      <div className="space-y-6 animate-slide-up">
        <div>
          <h1 className="text-2xl font-bold text-white">Peak Windows</h1>
          <p className="text-muted text-sm mt-0.5">
            {format(new Date(data.today), 'EEEE, MMMM d')} · Based on your sleep, HRV & stimulants
          </p>
        </div>
        <PeakDetail pw={pw} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Good {getGreeting()}, {data.user.name}
          </h1>
          <p className="text-muted text-sm mt-0.5">
            {format(new Date(data.today), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <div className="flex gap-2">
          {streaks.workout_streak > 0 && (
            <div className="badge-amber flex items-center gap-1">
              <Zap size={11} /> {streaks.workout_streak}d streak
            </div>
          )}
          {streaks.logging_streak > 0 && (
            <div className="badge-cyan flex items-center gap-1">
              <Activity size={11} /> {streaks.logging_streak}d logged
            </div>
          )}
        </div>
      </div>

      {/* Top row: Readiness + Peak Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Readiness */}
        <div className="card flex flex-col items-center justify-center gap-4 py-8">
          <ReadinessGauge score={pw.overall_readiness} label={pw.readiness_label} size="lg" />
          <div className="text-center space-y-1">
            <div className="text-sm font-semibold text-white">Today's Readiness</div>
            {pw.sleep_debt_hours > 0 && (
              <div className="text-xs text-amber flex items-center justify-center gap-1">
                <AlertTriangle size={11} /> {pw.sleep_debt_hours}h sleep debt
              </div>
            )}
          </div>
          <div className="w-full space-y-2 text-sm">
            <PeakPill icon={<Brain size={12} />} label="Mental Peak" time={fmtHour(pw.mental_peak_hour)} score={pw.mental_peak_score} color="violet" />
            <PeakPill icon={<Dumbbell size={12} />} label="Gym Peak" time={fmtHour(pw.physical_peak_hour)} score={pw.physical_peak_score} color="cyan" />
          </div>
        </div>

        {/* Peak chart */}
        <div className="card lg:col-span-2">
          <div className="section-header">
            <Zap size={16} className="text-cyan" />
            24-Hour Performance Windows
          </div>
          <PeakWindowChart
            scores={pw.hourly_scores}
            mentalPeakHour={pw.mental_peak_hour}
            physicalPeakHour={pw.physical_peak_hour}
          />
        </div>
      </div>

      {/* Today's Plan */}
      <div className="card">
        <div className="section-header">
          <Clock size={16} className="text-violet" />
          Today's Action Plan
        </div>
        <div className="space-y-2">
          {data.todays_plan.map((item, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
              item.startsWith('⚠') ? 'bg-amber/5 border border-amber/20' : 'bg-surface'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                item.startsWith('⚠') ? 'bg-amber/20 text-amber' : 'bg-cyan/10 text-cyan'
              }`}>
                {item.startsWith('⚠') ? '!' : i + 1}
              </div>
              <span className={item.startsWith('⚠') ? 'text-amber' : 'text-white/90'}>{item.replace('⚠ ', '')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Moon size={16} className="text-violet" />}
          label="Sleep"
          value={sl?.total_duration_hours ? `${sl.total_duration_hours.toFixed(1)}h` : '—'}
          sub={sl?.quality_score ? `Quality ${sl.quality_score}/10` : 'No data'}
          link="/sleep"
          color="violet"
        />
        <StatCard
          icon={<Activity size={16} className="text-cyan" />}
          label="Recovery"
          value={rec?.recovery_score ? `${rec.recovery_score.toFixed(0)}%` : '—'}
          sub={rec?.energy_level ? `Energy ${rec.energy_level}/10` : 'Log recovery'}
          link="/recovery"
          color="cyan"
        />
        <StatCard
          icon={<Utensils size={16} className="text-amber" />}
          label="Calories"
          value={ns.total_calories > 0 ? `${ns.total_calories.toFixed(0)}` : '—'}
          sub={`${ns.meal_count} meals logged`}
          link="/nutrition"
          color="amber"
        />
        <StatCard
          icon={<Droplets size={16} className="text-blue-400" />}
          label="Water"
          value={ns.total_water_ml > 0 ? `${(ns.total_water_ml / 1000).toFixed(1)}L` : '—'}
          sub="Target: 3.0L"
          link="/nutrition"
          color="blue"
        />
      </div>

      {/* Macros + Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Macros */}
        <div className="card">
          <div className="section-header">
            <Utensils size={16} className="text-amber" />
            Today's Macros
            <Link to="/nutrition" className="ml-auto text-xs text-cyan flex items-center gap-0.5 hover:underline">
              Log <ChevronRight size={12} />
            </Link>
          </div>
          {ns.total_calories > 0 ? (
            <div className="flex items-center justify-around py-2">
              <MacroRing label="Protein" value={ns.total_protein} target={180} color="#00f5d4" />
              <MacroRing label="Carbs" value={ns.total_carbs} target={250} color="#7b2fff" />
              <MacroRing label="Fat" value={ns.total_fat} target={80} color="#ffd60a" />
              <MacroRing label="Fiber" value={ns.total_fiber} target={30} color="#10b981" />
            </div>
          ) : (
            <div className="text-center text-muted text-sm py-6">
              No meals logged today
              <div className="mt-2">
                <Link to="/nutrition" className="btn-primary inline-flex">Log a meal</Link>
              </div>
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="card">
          <div className="section-header">
            <TrendingUp size={16} className="text-emerald-400" />
            Active Goals
            <Link to="/goals" className="ml-auto text-xs text-cyan flex items-center gap-0.5 hover:underline">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {data.active_goals.length > 0 ? (
            <div className="space-y-3">
              {data.active_goals.slice(0, 4).map(goal => (
                <div key={goal.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-white">{goal.name}</span>
                    <span className="text-xs text-muted font-mono">
                      {goal.current_value ?? '—'}/{goal.target_value ?? '?'} {goal.unit}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${goal.progress_pct ?? 0}%`,
                        background: (goal.progress_pct ?? 0) >= 80 ? '#00f5d4' : (goal.progress_pct ?? 0) >= 50 ? '#7b2fff' : '#ffd60a',
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted mt-0.5">{goal.progress_pct?.toFixed(0) ?? 0}% complete</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted text-sm py-6">
              No active goals
              <div className="mt-2">
                <Link to="/goals" className="btn-primary inline-flex">Set a goal</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gym & Focus windows detail */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card border-cyan/20">
          <div className="flex items-center gap-2 mb-3">
            <Dumbbell size={16} className="text-cyan" />
            <span className="font-semibold text-white">Training Window</span>
            <span className="ml-auto badge-cyan">{fmtHour(pw.physical_peak_hour)}</span>
          </div>
          <p className="text-sm text-white/80">{pw.gym_recommendation}</p>
        </div>
        <div className="card border-violet/20">
          <div className="flex items-center gap-2 mb-3">
            <Brain size={16} className="text-violet" />
            <span className="font-semibold text-white">Focus Window</span>
            <span className="ml-auto badge-violet">{fmtHour(pw.mental_peak_hour)}</span>
          </div>
          <p className="text-sm text-white/80">{pw.focus_recommendation}</p>
        </div>
      </div>
    </div>
  )
}

function PeakPill({ icon, label, time, score, color }: { icon: React.ReactNode; label: string; time: string; score: number; color: string }) {
  const clr = color === 'cyan' ? '#00f5d4' : '#7b2fff'
  return (
    <div className="flex items-center justify-between bg-surface rounded-lg px-3 py-2">
      <div className="flex items-center gap-2" style={{ color: clr }}>{icon}<span className="text-xs font-medium">{label}</span></div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted font-mono">{time}</span>
        <span className="text-xs font-bold" style={{ color: clr }}>{score.toFixed(0)}</span>
      </div>
    </div>
  )
}

function PeakDetail({ pw }: { pw: any }) {
  function fmtHour(h: number) {
    if (h === 0) return '12:00 AM'
    if (h < 12) return `${h}:00 AM`
    if (h === 12) return '12:00 PM'
    return `${h - 12}:00 PM`
  }
  return (
    <div className="space-y-4">
      <div className="card">
        <div className="section-header"><Zap size={16} className="text-cyan" />24-Hour Performance Windows</div>
        <PeakWindowChart scores={pw.hourly_scores} mentalPeakHour={pw.mental_peak_hour} physicalPeakHour={pw.physical_peak_hour} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card flex flex-col items-center gap-3 py-6">
          <ReadinessGauge score={pw.overall_readiness} label={pw.readiness_label} />
        </div>
        <div className="card">
          <div className="font-semibold text-cyan mb-2 flex items-center gap-2"><Dumbbell size={14} />Gym Peak</div>
          <div className="text-2xl font-bold text-white font-mono">{fmtHour(pw.physical_peak_hour)}</div>
          <div className="text-sm text-muted mt-1">Score: {pw.physical_peak_score.toFixed(0)}/100</div>
          <p className="text-sm text-white/80 mt-3">{pw.gym_recommendation}</p>
        </div>
        <div className="card">
          <div className="font-semibold text-violet mb-2 flex items-center gap-2"><Brain size={14} />Focus Peak</div>
          <div className="text-2xl font-bold text-white font-mono">{fmtHour(pw.mental_peak_hour)}</div>
          <div className="text-sm text-muted mt-1">Score: {pw.mental_peak_score.toFixed(0)}/100</div>
          <p className="text-sm text-white/80 mt-3">{pw.focus_recommendation}</p>
          {pw.stimulant_window && <p className="text-xs text-amber mt-2">{pw.stimulant_window}</p>}
        </div>
      </div>
      <div className="card">
        <div className="section-header">Peak Factors</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {Object.entries(pw.factors).map(([k, v]) => (
            <div key={k} className="bg-surface rounded-lg p-3">
              <div className="text-muted text-xs mb-1">{k.replace(/_/g, ' ')}</div>
              <div className="font-mono text-white font-semibold">{v !== null && v !== undefined ? String(v) : '—'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, link, color }: { icon: React.ReactNode; label: string; value: string; sub: string; link: string; color: string }) {
  const colors: Record<string, string> = { cyan: '#00f5d4', violet: '#7b2fff', amber: '#ffd60a', blue: '#60a5fa' }
  const c = colors[color] || '#00f5d4'
  return (
    <Link to={link} className="card hover:border-white/20 transition-colors cursor-pointer block">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs text-muted uppercase tracking-wider">{label}</span></div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: c }}>{value}</div>
      <div className="text-xs text-muted mt-1">{sub}</div>
    </Link>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

// Missing import for Utensils icon inline
function Utensils(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 16} height={props.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  )
}
