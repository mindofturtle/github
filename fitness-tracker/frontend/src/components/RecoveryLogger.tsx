import { useEffect, useState } from 'react'
import { Activity, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { logRecovery, getRecoveryHistory, RecoveryLog } from '../api/client'

const METRICS = [
  { key: 'muscle_soreness', label: 'Muscle Soreness', low: 'None', high: 'Extreme', invert: true },
  { key: 'energy_level', label: 'Energy Level', low: 'Exhausted', high: 'Explosive' },
  { key: 'stress_level', label: 'Stress Level', low: 'Zen', high: 'Maxed Out', invert: true },
  { key: 'mood_score', label: 'Mood', low: 'Terrible', high: 'Amazing' },
  { key: 'motivation_score', label: 'Motivation', low: 'Zero', high: 'Unstoppable' },
  { key: 'cognitive_clarity', label: 'Cognitive Clarity', low: 'Brain Fog', high: 'Crystal Clear' },
]

function scoreColor(score: number, invert = false) {
  const effective = invert ? 11 - score : score
  if (effective >= 8) return '#00f5d4'
  if (effective >= 6) return '#7b2fff'
  if (effective >= 4) return '#ffd60a'
  return '#ef233c'
}

export default function RecoveryLogger() {
  const [history, setHistory] = useState<RecoveryLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    muscle_soreness: 3,
    energy_level: 7,
    stress_level: 4,
    mood_score: 7,
    motivation_score: 7,
    cognitive_clarity: 7,
    injuries: '',
    notes: '',
  })

  const load = () => getRecoveryHistory().then(setHistory)
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await logRecovery({ ...form, injuries: form.injuries || null, notes: form.notes || null })
      setShowForm(false)
      load()
    } finally { setSaving(false) }
  }

  const previewScore = () => {
    const { muscle_soreness, energy_level, stress_level, mood_score, motivation_score, cognitive_clarity } = form
    const scores = [(10 - muscle_soreness), energy_level, (10 - stress_level), mood_score, motivation_score, cognitive_clarity]
    return Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length * 10) * 100)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Recovery Logger</h1><p className="text-sm text-muted">Track daily wellness to optimize your peak windows</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={14} />Log Recovery</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card border-emerald-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-white flex items-center gap-2"><Activity size={14} className="text-emerald-400" />Daily Recovery Check-In</div>
            <div className="text-sm">
              Preview score: <span className="font-bold tabular-nums" style={{ color: scoreColor(previewScore(), false) }}>{previewScore()}/100</span>
            </div>
          </div>

          <div><label className="label">Date</label><input type="date" className="input w-40" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {METRICS.map(({ key, label, low, high, invert }) => {
              const val = form[key as keyof typeof form] as number
              return (
                <div key={key} className="bg-surface rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-white">{label}</label>
                    <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(val, invert) }}>{val}/10</span>
                  </div>
                  <input
                    type="range" min={1} max={10} className="w-full"
                    value={val}
                    onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                    style={{ accentColor: scoreColor(val, invert) }}
                  />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>{low}</span><span>{high}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="label">Active Injuries / Pain Points</label><input type="text" className="input" placeholder="e.g. Left knee soreness" value={form.injuries} onChange={e => setForm(f => ({ ...f, injuries: e.target.value }))} /></div>
            <div><label className="label">Notes</label><input type="text" className="input" placeholder="Anything relevant..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Recovery Log'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="card">
        <div className="section-header"><Activity size={16} className="text-emerald-400" />Recovery History</div>
        {history.length === 0 ? (
          <div className="text-muted text-sm text-center py-8">No recovery logs yet. Check in daily for accurate peak window predictions!</div>
        ) : (
          <div className="space-y-2">
            {history.map(r => (
              <div key={r.id} className="p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-muted text-sm">{format(new Date(r.date), 'MMM d, yyyy')}</span>
                  {r.recovery_score != null && (
                    <span className="font-bold text-sm" style={{ color: scoreColor(r.recovery_score, false) }}>
                      {r.recovery_score.toFixed(0)}/100
                    </span>
                  )}
                  {r.injuries && <span className="badge-rose text-xs">{r.injuries}</span>}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                  {METRICS.map(({ key, label, invert }) => {
                    const val = r[key as keyof RecoveryLog] as number
                    return val != null ? (
                      <div key={key} className="text-center">
                        <div className="text-muted">{label.split(' ')[0]}</div>
                        <div className="font-bold tabular-nums" style={{ color: scoreColor(val, invert) }}>{val}/10</div>
                      </div>
                    ) : null
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
