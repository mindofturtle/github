import { useEffect, useState } from 'react'
import { User, Save } from 'lucide-react'
import { getUser, updateUser } from '../api/client'

const CHRONOTYPES = [
  { value: 'morning', label: 'Morning (Early Bird)', desc: 'Natural wake ~5-7 AM, peak performance earlier' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Natural wake ~7-9 AM, standard circadian rhythm' },
  { value: 'evening', label: 'Evening (Night Owl)', desc: 'Natural wake ~9-11 AM, peak performance later' },
]

export default function Profile() {
  const [form, setForm] = useState({
    name: '', age: '', weight_kg: '', height_cm: '', sex: '',
    chronotype: 'intermediate', default_wake_hour: 7, default_sleep_hour: 23,
    hrv_baseline: 50, resting_hr_baseline: 60,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getUser().then(u => setForm({
      name: u.name, age: u.age?.toString() || '', weight_kg: u.weight_kg?.toString() || '',
      height_cm: u.height_cm?.toString() || '', sex: u.sex || '',
      chronotype: u.chronotype, default_wake_hour: u.default_wake_hour,
      default_sleep_hour: u.default_sleep_hour, hrv_baseline: u.hrv_baseline,
      resting_hr_baseline: u.resting_hr_baseline,
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateUser({
        name: form.name,
        age: form.age ? parseInt(form.age) : undefined,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
        height_cm: form.height_cm ? parseFloat(form.height_cm) : undefined,
        sex: form.sex || undefined,
        chronotype: form.chronotype,
        default_wake_hour: form.default_wake_hour,
        default_sleep_hour: form.default_sleep_hour,
        hrv_baseline: form.hrv_baseline,
        resting_hr_baseline: form.resting_hr_baseline,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  function fmtH(h: number) {
    if (h === 0) return '12:00 AM'
    if (h < 12) return `${h}:00 AM`
    if (h === 12) return '12:00 PM'
    return `${h - 12}:00 PM`
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
        <p className="text-sm text-muted mt-0.5">Your profile affects peak window calculations — keep it accurate</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          <div className="section-header"><User size={14} className="text-cyan" />Personal Info</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Name</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="label">Age</label><input type="number" className="input" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} /></div>
            <div><label className="label">Weight (kg)</label><input type="number" step="0.1" className="input" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} /></div>
            <div><label className="label">Height (cm)</label><input type="number" step="0.1" className="input" value={form.height_cm} onChange={e => setForm(f => ({ ...f, height_cm: e.target.value }))} /></div>
            <div><label className="label">Sex</label><select className="input" value={form.sex} onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}><option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
          </div>
        </div>

        <div className="card">
          <div className="section-header">Chronotype & Sleep Schedule</div>
          <p className="text-xs text-muted mb-3">Your chronotype shifts the entire peak window curve — this has the biggest impact on accuracy.</p>
          <div className="space-y-2 mb-4">
            {CHRONOTYPES.map(ct => (
              <label key={ct.value} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${form.chronotype === ct.value ? 'bg-cyan/5 border-cyan/30' : 'bg-surface border-transparent hover:border-border'}`}>
                <input type="radio" name="chronotype" value={ct.value} checked={form.chronotype === ct.value} onChange={e => setForm(f => ({ ...f, chronotype: e.target.value }))} className="mt-0.5" />
                <div>
                  <div className="font-medium text-white text-sm">{ct.label}</div>
                  <div className="text-xs text-muted">{ct.desc}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Default Wake Time: {fmtH(form.default_wake_hour)}</label>
              <input type="range" min={4} max={12} className="w-full mt-2" value={form.default_wake_hour} onChange={e => setForm(f => ({ ...f, default_wake_hour: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Default Sleep Time: {fmtH(form.default_sleep_hour)}</label>
              <input type="range" min={20} max={26} className="w-full mt-2" value={form.default_sleep_hour} onChange={e => setForm(f => ({ ...f, default_sleep_hour: Number(e.target.value) }))} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="section-header">Baseline Metrics</div>
          <p className="text-xs text-muted mb-3">These baselines are used to calculate how much your current HRV/RHR deviates, which affects your readiness score.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">HRV Baseline: {form.hrv_baseline} ms</label>
              <input type="range" min={20} max={120} className="w-full mt-2" value={form.hrv_baseline} onChange={e => setForm(f => ({ ...f, hrv_baseline: Number(e.target.value) }))} />
              <div className="flex justify-between text-xs text-muted mt-1"><span>Low</span><span>High</span></div>
            </div>
            <div>
              <label className="label">Resting HR Baseline: {form.resting_hr_baseline} bpm</label>
              <input type="range" min={40} max={90} className="w-full mt-2" value={form.resting_hr_baseline} onChange={e => setForm(f => ({ ...f, resting_hr_baseline: Number(e.target.value) }))} />
              <div className="flex justify-between text-xs text-muted mt-1"><span>40</span><span>90</span></div>
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saved ? '✓ Saved!' : saving ? 'Saving...' : <><Save size={14} />Save Profile</>}
        </button>
      </form>
    </div>
  )
}
