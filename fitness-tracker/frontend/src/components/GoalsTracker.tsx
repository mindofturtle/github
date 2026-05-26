import { useEffect, useState } from 'react'
import { Target, Plus, Trash2, Edit3 } from 'lucide-react'
import { format } from 'date-fns'
import { getGoals, createGoal, updateGoal, deleteGoal, Goal } from '../api/client'

const CATEGORIES = ['strength', 'body_comp', 'endurance', 'nutrition', 'habit', 'mental', 'recovery']
const PRIORITY_LABELS = ['', 'Critical', 'High', 'Medium', 'Low', 'Backlog']
const CAT_COLORS: Record<string, string> = {
  strength: 'badge-cyan', body_comp: 'badge-violet', endurance: 'badge-green',
  nutrition: 'badge-amber', habit: 'badge-rose', mental: 'badge-violet', recovery: 'badge-green',
}

export default function GoalsTracker() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', category: 'strength', target_value: '', current_value: '',
    unit: '', deadline: '', priority: 3, notes: '',
  })

  const load = () => getGoals().then(setGoals)
  useEffect(() => { load() }, [])

  const resetForm = () => {
    setForm({ name: '', category: 'strength', target_value: '', current_value: '', unit: '', deadline: '', priority: 3, notes: '' })
    setEditId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        target_value: form.target_value ? parseFloat(form.target_value) : null,
        current_value: form.current_value ? parseFloat(form.current_value) : null,
        deadline: form.deadline || null,
        notes: form.notes || null,
        unit: form.unit || null,
      }
      if (editId) {
        await updateGoal(editId, payload)
      } else {
        await createGoal(payload)
      }
      setShowForm(false)
      resetForm()
      load()
    } finally { setSaving(false) }
  }

  const handleEdit = (g: Goal) => {
    setForm({
      name: g.name, category: g.category,
      target_value: g.target_value?.toString() || '',
      current_value: g.current_value?.toString() || '',
      unit: g.unit || '', deadline: g.deadline || '',
      priority: g.priority, notes: g.notes || '',
    })
    setEditId(g.id)
    setShowForm(true)
  }

  const handleUpdateProgress = async (g: Goal, newVal: string) => {
    const v = parseFloat(newVal)
    if (isNaN(v)) return
    await updateGoal(g.id, { current_value: v })
    load()
  }

  const byCategory = CATEGORIES.map(cat => ({
    cat, goals: goals.filter(g => g.category === cat)
  })).filter(g => g.goals.length > 0)

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Goals</h1><p className="text-sm text-muted">Set targets, track progress, stay accountable</p></div>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }} className="btn-primary flex items-center gap-2"><Plus size={14} />New Goal</button>
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center"><div className="text-xs text-muted mb-1">Total Goals</div><div className="text-2xl font-bold text-white">{goals.length}</div></div>
          <div className="card text-center"><div className="text-xs text-muted mb-1">On Track (≥50%)</div><div className="text-2xl font-bold text-cyan">{goals.filter(g => (g.progress_pct || 0) >= 50).length}</div></div>
          <div className="card text-center"><div className="text-xs text-muted mb-1">Completed (100%)</div><div className="text-2xl font-bold text-emerald-400">{goals.filter(g => (g.progress_pct || 0) >= 100).length}</div></div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card border-cyan/20 space-y-4">
          <div className="font-semibold text-white">{editId ? 'Edit Goal' : 'New Goal'}</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="md:col-span-2"><label className="label">Goal Name</label><input required className="input" placeholder="e.g. Bench Press 100kg" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="label">Category</label><select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label">Current Value</label><input type="number" step="any" className="input" placeholder="Where you are now" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: e.target.value }))} /></div>
            <div><label className="label">Target Value</label><input type="number" step="any" className="input" placeholder="Where you want to be" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} /></div>
            <div><label className="label">Unit</label><input className="input" placeholder="kg / lbs / % / days" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} /></div>
            <div><label className="label">Deadline</label><input type="date" className="input" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></div>
            <div>
              <label className="label">Priority: {PRIORITY_LABELS[form.priority]}</label>
              <input type="range" min={1} max={5} className="w-full mt-2" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))} />
            </div>
            <div><label className="label">Notes</label><input type="text" className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editId ? 'Update Goal' : 'Create Goal'}</button>
            <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="card text-center py-12 text-muted">
          <Target size={32} className="mx-auto mb-3 opacity-30" />
          <div className="text-sm">No goals set. Create your first goal to get started!</div>
        </div>
      ) : (
        byCategory.map(({ cat, goals: catGoals }) => (
          <div key={cat} className="card">
            <div className="section-header capitalize">
              <span className={`badge ${CAT_COLORS[cat] || 'badge'}`}>{cat.replace('_', ' ')}</span>
              <span className="text-muted font-normal text-sm">{catGoals.length} goal{catGoals.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="space-y-3">
              {catGoals.map(g => (
                <div key={g.id} className="bg-surface rounded-lg p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="font-medium text-white">{g.name}</div>
                      <div className="text-xs text-muted mt-0.5 flex items-center gap-3">
                        <span>Priority: {PRIORITY_LABELS[g.priority]}</span>
                        {g.deadline && <span>Deadline: {format(new Date(g.deadline), 'MMM d, yyyy')}</span>}
                        {g.notes && <span>{g.notes}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleEdit(g)} className="text-muted hover:text-cyan p-1"><Edit3 size={13} /></button>
                      <button onClick={() => deleteGoal(g.id).then(load)} className="text-muted hover:text-rose p-1"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="h-2 bg-card rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, g.progress_pct || 0)}%`,
                            background: (g.progress_pct || 0) >= 100 ? '#10b981' : (g.progress_pct || 0) >= 50 ? '#00f5d4' : (g.progress_pct || 0) >= 25 ? '#7b2fff' : '#ffd60a',
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-xs font-mono text-white w-16 text-right">
                      {g.current_value ?? '?'} / {g.target_value ?? '?'} {g.unit}
                    </div>
                    <div className="text-xs font-bold w-12 text-right" style={{ color: (g.progress_pct || 0) >= 100 ? '#10b981' : '#00f5d4' }}>
                      {g.progress_pct?.toFixed(0) ?? 0}%
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-muted">Update progress:</span>
                    <input
                      type="number" step="any"
                      className="input w-24 text-xs py-1"
                      placeholder={`${g.current_value ?? 0}`}
                      onBlur={e => { if (e.target.value) handleUpdateProgress(g, e.target.value) }}
                      onKeyDown={e => { if (e.key === 'Enter') handleUpdateProgress(g, (e.target as HTMLInputElement).value) }}
                    />
                    <span className="text-xs text-muted">{g.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
