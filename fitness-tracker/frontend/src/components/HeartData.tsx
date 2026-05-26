import { useEffect, useState } from 'react'
import { Heart, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { logHeart, getHeartHistory, HeartLog } from '../api/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function HeartData() {
  const [history, setHistory] = useState<HeartLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    resting_hr: '', hrv: '', hrv_rmssd: '', spo2: '', vo2max: '',
    max_hr_today: '', blood_pressure_systolic: '', blood_pressure_diastolic: '', notes: ''
  })

  const load = () => getHeartHistory().then(setHistory)
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await logHeart({
        date: form.date,
        resting_hr: form.resting_hr ? parseFloat(form.resting_hr) : null,
        hrv: form.hrv ? parseFloat(form.hrv) : null,
        hrv_rmssd: form.hrv_rmssd ? parseFloat(form.hrv_rmssd) : null,
        spo2: form.spo2 ? parseFloat(form.spo2) : null,
        vo2max: form.vo2max ? parseFloat(form.vo2max) : null,
        max_hr_today: form.max_hr_today ? parseFloat(form.max_hr_today) : null,
        blood_pressure_systolic: form.blood_pressure_systolic ? parseInt(form.blood_pressure_systolic) : null,
        blood_pressure_diastolic: form.blood_pressure_diastolic ? parseInt(form.blood_pressure_diastolic) : null,
        notes: form.notes || null,
      })
      setShowForm(false)
      load()
    } finally { setSaving(false) }
  }

  const chartData = [...history].reverse().map(h => ({
    date: format(new Date(h.date), 'MMM d'),
    hrv: h.hrv, rhr: h.resting_hr, spo2: h.spo2, vo2max: h.vo2max,
  }))

  const latest = history[0]

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Heart & HRV</h1><p className="text-sm text-muted">Track cardiovascular health and recovery readiness</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Plus size={14} />Log Heart Data</button>
      </div>

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Resting HR" value={latest.resting_hr ? `${latest.resting_hr}` : '—'} unit="bpm" color="#ef233c" />
          <MetricCard label="HRV" value={latest.hrv ? `${latest.hrv}` : '—'} unit="ms" color="#00f5d4" />
          <MetricCard label="SpO2" value={latest.spo2 ? `${latest.spo2}` : '—'} unit="%" color="#60a5fa" />
          <MetricCard label="VO2 Max" value={latest.vo2max ? `${latest.vo2max}` : '—'} unit="ml/kg/min" color="#7b2fff" />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card border-rose/20 space-y-4">
          <div className="font-semibold text-white flex items-center gap-2"><Heart size={14} className="text-rose" />Log Heart Data</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label className="label">Resting HR (bpm)</label><input type="number" className="input" placeholder="e.g. 58" value={form.resting_hr} onChange={e => setForm(f => ({ ...f, resting_hr: e.target.value }))} /></div>
            <div><label className="label">HRV (ms)</label><input type="number" className="input" placeholder="e.g. 62" value={form.hrv} onChange={e => setForm(f => ({ ...f, hrv: e.target.value }))} /></div>
            <div><label className="label">HRV RMSSD (ms)</label><input type="number" className="input" placeholder="e.g. 45" value={form.hrv_rmssd} onChange={e => setForm(f => ({ ...f, hrv_rmssd: e.target.value }))} /></div>
            <div><label className="label">SpO2 (%)</label><input type="number" step="0.1" min="90" max="100" className="input" placeholder="e.g. 98.5" value={form.spo2} onChange={e => setForm(f => ({ ...f, spo2: e.target.value }))} /></div>
            <div><label className="label">VO2 Max</label><input type="number" step="0.1" className="input" placeholder="e.g. 52" value={form.vo2max} onChange={e => setForm(f => ({ ...f, vo2max: e.target.value }))} /></div>
            <div><label className="label">Max HR Today</label><input type="number" className="input" placeholder="e.g. 172" value={form.max_hr_today} onChange={e => setForm(f => ({ ...f, max_hr_today: e.target.value }))} /></div>
            <div><label className="label">Blood Pressure (sys)</label><input type="number" className="input" placeholder="120" value={form.blood_pressure_systolic} onChange={e => setForm(f => ({ ...f, blood_pressure_systolic: e.target.value }))} /></div>
            <div><label className="label">Blood Pressure (dia)</label><input type="number" className="input" placeholder="80" value={form.blood_pressure_diastolic} onChange={e => setForm(f => ({ ...f, blood_pressure_diastolic: e.target.value }))} /></div>
            <div><label className="label">Notes</label><input type="text" className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {chartData.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card"><div className="section-header"><Heart size={14} className="text-cyan" />HRV Trend</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" /><XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} /><YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} /><Tooltip contentStyle={{ background: '#14141f', border: '1px solid #1e1e2e', borderRadius: 8 }} /><Line type="monotone" dataKey="hrv" stroke="#00f5d4" strokeWidth={2} dot={{ fill: '#00f5d4', r: 3 }} connectNulls /></LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card"><div className="section-header"><Heart size={14} className="text-rose" />Resting HR</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" /><XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} /><YAxis domain={[40, 100]} tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} /><Tooltip contentStyle={{ background: '#14141f', border: '1px solid #1e1e2e', borderRadius: 8 }} /><Line type="monotone" dataKey="rhr" stroke="#ef233c" strokeWidth={2} dot={{ fill: '#ef233c', r: 3 }} connectNulls /></LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="card">
        <div className="section-header"><Heart size={16} className="text-rose" />Heart Log History</div>
        {history.length === 0 ? (
          <div className="text-muted text-sm text-center py-8">No heart data logged yet</div>
        ) : (
          <div className="space-y-2">
            {history.map(h => (
              <div key={h.id} className="flex flex-wrap items-center gap-x-6 gap-y-1 p-3 bg-surface rounded-lg text-sm">
                <span className="text-muted w-16">{format(new Date(h.date), 'MMM d')}</span>
                {h.resting_hr && <span className="text-rose font-mono">HR: {h.resting_hr}bpm</span>}
                {h.hrv && <span className="text-cyan font-mono">HRV: {h.hrv}ms</span>}
                {h.spo2 && <span className="text-blue-400 font-mono">SpO2: {h.spo2}%</span>}
                {h.vo2max && <span className="text-violet font-mono">VO2: {h.vo2max}</span>}
                {h.blood_pressure_systolic && <span className="text-amber font-mono">BP: {h.blood_pressure_systolic}/{h.blood_pressure_diastolic}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, unit, color }: { label: string; value: string; unit: string; color: string }) {
  return (
    <div className="card text-center">
      <div className="text-xs text-muted uppercase tracking-wider mb-2">{label}</div>
      <div className="text-3xl font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-xs text-muted mt-1">{unit}</div>
    </div>
  )
}
