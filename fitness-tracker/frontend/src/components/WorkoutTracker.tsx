import { useEffect, useState } from 'react'
import { Dumbbell, Plus, Trash2, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { getExercises, createExercise, logWorkout, getWorkouts, deleteWorkout, getOverloadHistory, Exercise, WorkoutSession } from '../api/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const SESSION_TYPES = ['push', 'pull', 'legs', 'upper', 'lower', 'full body', 'cardio', 'active recovery', 'rest']
const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'cardio']
const CATEGORIES = ['push', 'pull', 'legs', 'cardio', 'core']

interface SetForm {
  exercise_id: number | ''
  set_number: number
  weight_kg: number
  reps: number
  rpe: number
  is_pr: boolean
}

export default function WorkoutTracker() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showNewEx, setShowNewEx] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [overloadEx, setOverloadEx] = useState<number | null>(null)
  const [overloadData, setOverloadData] = useState<any[]>([])

  const [sessionForm, setSessionForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    session_type: 'push',
    duration_minutes: 60,
    intensity_score: 7,
    perceived_exertion: 7,
    notes: '',
  })

  const [sets, setSets] = useState<SetForm[]>([
    { exercise_id: '', set_number: 1, weight_kg: 0, reps: 8, rpe: 7, is_pr: false }
  ])

  const [newExForm, setNewExForm] = useState({ name: '', category: 'push', primary_muscle: '', is_compound: true })

  const load = async () => {
    const [ex, w] = await Promise.all([getExercises(), getWorkouts(60)])
    setExercises(ex)
    setWorkouts(w)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const addSet = () => setSets(p => [...p, { exercise_id: '', set_number: p.length + 1, weight_kg: p[p.length - 1]?.weight_kg || 0, reps: p[p.length - 1]?.reps || 8, rpe: 7, is_pr: false }])
  const removeSet = (i: number) => setSets(p => p.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, set_number: idx + 1 })))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sets.some(s => s.exercise_id)) return
    setSaving(true)
    try {
      await logWorkout({
        ...sessionForm,
        sets: sets.filter(s => s.exercise_id).map(s => ({ ...s, exercise_id: Number(s.exercise_id) })),
      })
      setShowForm(false)
      setSets([{ exercise_id: '', set_number: 1, weight_kg: 0, reps: 8, rpe: 7, is_pr: false }])
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleCreateEx = async (e: React.FormEvent) => {
    e.preventDefault()
    await createExercise(newExForm)
    setShowNewEx(false)
    setNewExForm({ name: '', category: 'push', primary_muscle: '', is_compound: true })
    const ex = await getExercises()
    setExercises(ex)
  }

  const loadOverload = async (exId: number) => {
    if (overloadEx === exId) { setOverloadEx(null); return }
    const data = await getOverloadHistory(exId)
    setOverloadData(data)
    setOverloadEx(exId)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Workout Tracker</h1>
          <p className="text-sm text-muted mt-0.5">Log sessions, track progressive overload</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNewEx(!showNewEx)} className="btn-secondary flex items-center gap-1"><Plus size={14} /> Exercise</button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2"><Dumbbell size={14} /> Log Workout</button>
        </div>
      </div>

      {showNewEx && (
        <form onSubmit={handleCreateEx} className="card border-violet/20 space-y-3">
          <div className="font-semibold text-white">Add New Exercise</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2"><label className="label">Name</label><input required className="input" placeholder="e.g. Bench Press" value={newExForm.name} onChange={e => setNewExForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="label">Category</label><select className="input" value={newExForm.category} onChange={e => setNewExForm(p => ({ ...p, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label">Primary Muscle</label><select className="input" value={newExForm.primary_muscle} onChange={e => setNewExForm(p => ({ ...p, primary_muscle: e.target.value }))}><option value="">—</option>{MUSCLE_GROUPS.map(m => <option key={m}>{m}</option>)}</select></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Add Exercise</button>
            <button type="button" onClick={() => setShowNewEx(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card border-cyan/20 space-y-4">
          <div className="font-semibold text-white flex items-center gap-2"><Dumbbell size={14} className="text-cyan" />Log Session</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="label">Date</label><input type="date" className="input" value={sessionForm.date} onChange={e => setSessionForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div><label className="label">Session Type</label><select className="input" value={sessionForm.session_type} onChange={e => setSessionForm(p => ({ ...p, session_type: e.target.value }))}>{SESSION_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className="label">Duration (min)</label><input type="number" className="input" value={sessionForm.duration_minutes} onChange={e => setSessionForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} /></div>
            <div>
              <label className="label">Intensity: {sessionForm.intensity_score}/10</label>
              <input type="range" min={1} max={10} className="w-full mt-2" value={sessionForm.intensity_score} onChange={e => setSessionForm(p => ({ ...p, intensity_score: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">RPE: {sessionForm.perceived_exertion}/10</label>
              <input type="range" min={1} max={10} className="w-full mt-2" value={sessionForm.perceived_exertion} onChange={e => setSessionForm(p => ({ ...p, perceived_exertion: Number(e.target.value) }))} />
            </div>
            <div><label className="label">Notes</label><input type="text" className="input" placeholder="Optional notes" value={sessionForm.notes} onChange={e => setSessionForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>

          <div>
            <div className="font-medium text-white mb-2 text-sm">Sets</div>
            <div className="space-y-2">
              {sets.map((set, i) => (
                <div key={i} className="grid grid-cols-6 gap-2 items-end">
                  <div className="col-span-2">
                    {i === 0 && <label className="label">Exercise</label>}
                    <select className="input" value={set.exercise_id} onChange={e => setSets(p => p.map((s, idx) => idx === i ? { ...s, exercise_id: e.target.value as any } : s))}>
                      <option value="">Select...</option>
                      {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                    </select>
                  </div>
                  <div>
                    {i === 0 && <label className="label">Weight (kg)</label>}
                    <input type="number" step="0.5" min="0" className="input" value={set.weight_kg} onChange={e => setSets(p => p.map((s, idx) => idx === i ? { ...s, weight_kg: Number(e.target.value) } : s))} />
                  </div>
                  <div>
                    {i === 0 && <label className="label">Reps</label>}
                    <input type="number" min="1" className="input" value={set.reps} onChange={e => setSets(p => p.map((s, idx) => idx === i ? { ...s, reps: Number(e.target.value) } : s))} />
                  </div>
                  <div>
                    {i === 0 && <label className="label">RPE</label>}
                    <input type="number" step="0.5" min="1" max="10" className="input" value={set.rpe} onChange={e => setSets(p => p.map((s, idx) => idx === i ? { ...s, rpe: Number(e.target.value) } : s))} />
                  </div>
                  <div className="flex items-end gap-1">
                    {i === 0 && <label className="label opacity-0">del</label>}
                    <label className="flex items-center gap-1 text-xs text-amber cursor-pointer">
                      <input type="checkbox" checked={set.is_pr} onChange={e => setSets(p => p.map((s, idx) => idx === i ? { ...s, is_pr: e.target.checked } : s))} />
                      PR
                    </label>
                    {sets.length > 1 && (
                      <button type="button" onClick={() => removeSet(i)} className="text-rose hover:text-rose/80 ml-1">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSet} className="btn-secondary mt-2 text-xs flex items-center gap-1"><Plus size={12} />Add Set</button>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Log Session'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Overload chart */}
      {overloadEx && overloadData.length > 0 && (
        <div className="card border-cyan/20">
          <div className="section-header"><TrendingUp size={14} className="text-cyan" />Progressive Overload — {exercises.find(e => e.id === overloadEx)?.name}</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={overloadData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} />
              <Tooltip contentStyle={{ background: '#14141f', border: '1px solid #1e1e2e', borderRadius: 8 }} labelStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="weight_kg" stroke="#00f5d4" strokeWidth={2} name="Weight (kg)" dot={d => d.payload.is_pr ? <circle cx={d.cx} cy={d.cy} r={5} fill="#ffd60a" stroke="#ffd60a" /> : <circle cx={d.cx} cy={d.cy} r={2} fill="#00f5d4" />} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History */}
      <div className="card">
        <div className="section-header"><Dumbbell size={16} className="text-cyan" />Workout History</div>
        {loading ? (
          <div className="text-muted text-sm text-center py-8">Loading...</div>
        ) : workouts.length === 0 ? (
          <div className="text-muted text-sm text-center py-8">No workouts logged yet. Hit the gym!</div>
        ) : (
          <div className="space-y-2">
            {workouts.map(w => (
              <div key={w.id} className="bg-surface rounded-lg overflow-hidden">
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-card/50 transition-colors"
                  onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                >
                  <div className={`badge ${typeColor(w.session_type)}`}>{w.session_type}</div>
                  <div className="text-sm text-muted">{format(new Date(w.date), 'MMM d')}</div>
                  <div className="text-sm text-white">{w.duration_minutes}min</div>
                  <div className="text-xs text-muted">RPE {w.perceived_exertion}/10</div>
                  <div className="text-xs text-muted">{w.volume_total?.toFixed(0)} kg vol</div>
                  <div className="ml-auto flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); deleteWorkout(w.id).then(load) }} className="text-muted hover:text-rose transition-colors"><Trash2 size={13} /></button>
                    {expandedId === w.id ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
                  </div>
                </div>
                {expandedId === w.id && w.exercise_sets.length > 0 && (
                  <div className="px-3 pb-3 pt-0 border-t border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted">
                          <th className="text-left py-1 pr-4">Exercise</th>
                          <th className="text-right pr-2">Set</th>
                          <th className="text-right pr-2">Weight</th>
                          <th className="text-right pr-2">Reps</th>
                          <th className="text-right pr-2">RPE</th>
                          <th className="text-right">Vol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {w.exercise_sets.map((s, i) => (
                          <tr key={i} className={`${s.is_pr ? 'text-amber' : 'text-white/80'}`}>
                            <td className="py-0.5 pr-4 flex items-center gap-1">
                              {s.is_pr && <span className="text-amber text-xs">PR</span>}
                              <button onClick={() => loadOverload(s.exercise_id)} className="hover:text-cyan text-left">{s.exercise_name}</button>
                            </td>
                            <td className="text-right pr-2 font-mono">{s.set_number}</td>
                            <td className="text-right pr-2 font-mono">{s.weight_kg}kg</td>
                            <td className="text-right pr-2 font-mono">{s.reps}</td>
                            <td className="text-right pr-2 font-mono">{s.rpe}</td>
                            <td className="text-right font-mono">{((s.weight_kg || 0) * (s.reps || 1)).toFixed(0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

function typeColor(t: string) {
  const m: Record<string, string> = {
    push: 'badge-cyan', pull: 'badge-violet', legs: 'badge-green',
    upper: 'badge-amber', lower: 'badge-rose', cardio: 'badge-amber',
  }
  return m[t] || 'badge'
}
