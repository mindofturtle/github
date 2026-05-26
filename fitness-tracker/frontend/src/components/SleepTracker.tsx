import { useEffect, useState } from 'react'
import { Moon, Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { logSleep, getSleepHistory, SleepLog } from '../api/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const QUALITY_LABELS = ['', 'Terrible', 'Very Bad', 'Bad', 'Poor', 'Fair', 'Ok', 'Good', 'Very Good', 'Excellent', 'Perfect']

export default function SleepTracker() {
  const [history, setHistory] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    bedtime_hour: 23,
    wake_hour: 7,
    quality_score: 7,
    deep_sleep_hours: '',
    rem_sleep_hours: '',
    awakenings: 0,
    hrv_morning: '',
    notes: '',
  })

  const load = () => getSleepHistory(30).then(setHistory).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const duration = form.wake_hour >= form.bedtime_hour
        ? form.wake_hour - form.bedtime_hour
        : (24 - form.bedtime_hour) + form.wake_hour
      await logSleep({
        ...form,
        total_duration_hours: parseFloat(duration.toFixed(2)),
        deep_sleep_hours: form.deep_sleep_hours ? parseFloat(form.deep_sleep_hours) : null,
        rem_sleep_hours: form.rem_sleep_hours ? parseFloat(form.rem_sleep_hours) : null,
        hrv_morning: form.hrv_morning ? parseFloat(form.hrv_morning) : null,
      })
      setShowForm(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  const chartData = [...history].reverse().map(s => ({
    date: format(new Date(s.date), 'MMM d'),
    duration: s.total_duration_hours,
    quality: s.quality_score,
    hrv: s.hrv_morning,
  }))

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sleep Tracker</h1>
          <p className="text-sm text-muted mt-0.5">Log and analyze your sleep quality & HRV</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Log Sleep
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4 border-cyan/20">
          <div className="font-semibold text-white flex items-center gap-2"><Moon size={14} className="text-violet" /> Log Sleep Session</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div>
              <label className="label">Bedtime</label>
              <select className="input" value={form.bedtime_hour} onChange={e => setForm(p => ({ ...p, bedtime_hour: Number(e.target.value) }))}>
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{fmtH(i)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Wake Time</label>
              <select className="input" value={form.wake_hour} onChange={e => setForm(p => ({ ...p, wake_hour: Number(e.target.value) }))}>
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{fmtH(i)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quality: {form.quality_score}/10 — {QUALITY_LABELS[form.quality_score]}</label>
              <input type="range" min={1} max={10} className="w-full mt-2" value={form.quality_score} onChange={e => setForm(p => ({ ...p, quality_score: Number(e.target.value) }))} />
            </div>
            <div><label className="label">Deep Sleep (hrs)</label><input type="number" step="0.1" min="0" max="12" className="input" placeholder="e.g. 1.5" value={form.deep_sleep_hours} onChange={e => setForm(p => ({ ...p, deep_sleep_hours: e.target.value }))} /></div>
            <div><label className="label">REM Sleep (hrs)</label><input type="number" step="0.1" min="0" max="12" className="input" placeholder="e.g. 2.0" value={form.rem_sleep_hours} onChange={e => setForm(p => ({ ...p, rem_sleep_hours: e.target.value }))} /></div>
            <div><label className="label">Awakenings</label><input type="number" min="0" className="input" value={form.awakenings} onChange={e => setForm(p => ({ ...p, awakenings: Number(e.target.value) }))} /></div>
            <div><label className="label">Morning HRV (ms)</label><input type="number" step="1" className="input" placeholder="e.g. 55" value={form.hrv_morning} onChange={e => setForm(p => ({ ...p, hrv_morning: e.target.value }))} /></div>
            <div className="md:col-span-3"><label className="label">Notes</label><input type="text" className="input" placeholder="Dreams, disturbances, etc." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Sleep Log'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card">
            <div className="section-header"><Moon size={14} className="text-violet" />Sleep Duration (hrs)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
                <YAxis domain={[0, 12]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ background: '#14141f', border: '1px solid #1e1e2e', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="duration" stroke="#7b2fff" strokeWidth={2} dot={{ fill: '#7b2fff', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div className="section-header"><Moon size={14} className="text-cyan" />HRV Trend (ms)</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
                <Tooltip contentStyle={{ background: '#14141f', border: '1px solid #1e1e2e', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
                <Line type="monotone" dataKey="hrv" stroke="#00f5d4" strokeWidth={2} dot={{ fill: '#00f5d4', r: 3 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <div className="section-header"><Moon size={16} className="text-violet" />Sleep History</div>
        {loading ? (
          <div className="text-muted text-sm text-center py-8">Loading...</div>
        ) : history.length === 0 ? (
          <div className="text-muted text-sm text-center py-8">No sleep logs yet. Start tracking tonight!</div>
        ) : (
          <div className="space-y-2">
            {history.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-3 bg-surface rounded-lg text-sm">
                <div className="text-muted w-20 flex-shrink-0">{format(new Date(s.date), 'MMM d')}</div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-2">
                  <Stat label="Duration" value={s.total_duration_hours ? `${s.total_duration_hours.toFixed(1)}h` : '—'} />
                  <Stat label="Quality" value={s.quality_score ? `${s.quality_score}/10` : '—'} />
                  <Stat label="Deep" value={s.deep_sleep_hours ? `${s.deep_sleep_hours}h` : '—'} />
                  <Stat label="REM" value={s.rem_sleep_hours ? `${s.rem_sleep_hours}h` : '—'} />
                  <Stat label="HRV" value={s.hrv_morning ? `${s.hrv_morning}ms` : '—'} />
                </div>
                {s.quality_score && (
                  <div className={`badge ${s.quality_score >= 8 ? 'badge-green' : s.quality_score >= 6 ? 'badge-cyan' : s.quality_score >= 4 ? 'badge-amber' : 'badge-rose'}`}>
                    {QUALITY_LABELS[s.quality_score]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted text-xs">{label}</div>
      <div className="font-mono text-white text-xs">{value}</div>
    </div>
  )
}

function fmtH(h: number) {
  if (h === 0) return '12:00 AM'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}
