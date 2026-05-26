import { useEffect, useState } from 'react'
import { Plus, Trash2, Droplets } from 'lucide-react'
import { format } from 'date-fns'
import { logMeal, getTodayMeals, deleteMeal, logWater, getTodayWater, NutritionLog } from '../api/client'

const MEAL_PRESETS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout', 'Shake']

export default function NutritionLogger() {
  const [meals, setMeals] = useState<NutritionLog[]>([])
  const [water, setWater] = useState(0)
  const [showMeal, setShowMeal] = useState(false)
  const [showWater, setShowWater] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    meal_name: 'Lunch',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    fiber_g: '',
    sugar_g: '',
    sodium_mg: '',
    logged_at_hour: new Date().getHours(),
    notes: '',
  })
  const [waterAmt, setWaterAmt] = useState(250)

  const load = () => Promise.all([getTodayMeals(), getTodayWater()]).then(([m, w]) => { setMeals(m); setWater(w.total_ml) })
  useEffect(() => { load() }, [])

  const totals = meals.reduce((acc, m) => ({
    cal: acc.cal + m.calories, pro: acc.pro + m.protein_g,
    carb: acc.carb + m.carbs_g, fat: acc.fat + m.fat_g, fiber: acc.fiber + m.fiber_g,
  }), { cal: 0, pro: 0, carb: 0, fat: 0, fiber: 0 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await logMeal({
        ...form,
        calories: parseFloat(form.calories) || 0,
        protein_g: parseFloat(form.protein_g) || 0,
        carbs_g: parseFloat(form.carbs_g) || 0,
        fat_g: parseFloat(form.fat_g) || 0,
        fiber_g: parseFloat(form.fiber_g) || 0,
        sugar_g: parseFloat(form.sugar_g) || 0,
        sodium_mg: parseFloat(form.sodium_mg) || 0,
      })
      setShowMeal(false)
      load()
    } finally { setSaving(false) }
  }

  const handleWater = async (e: React.FormEvent) => {
    e.preventDefault()
    await logWater({ date: format(new Date(), 'yyyy-MM-dd'), amount_ml: waterAmt, logged_at_hour: new Date().getHours() })
    setShowWater(false)
    load()
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Nutrition Logger</h1><p className="text-sm text-muted mt-0.5">Track macros, calories, and hydration</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowWater(!showWater)} className="btn-secondary flex items-center gap-1"><Droplets size={14} />+Water</button>
          <button onClick={() => setShowMeal(!showMeal)} className="btn-primary flex items-center gap-2"><Plus size={14} />Log Meal</button>
        </div>
      </div>

      {/* Daily Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MacroCard label="Calories" value={totals.cal.toFixed(0)} unit="kcal" target={2500} color="#ffd60a" />
        <MacroCard label="Protein" value={totals.pro.toFixed(0)} unit="g" target={180} color="#00f5d4" />
        <MacroCard label="Carbs" value={totals.carb.toFixed(0)} unit="g" target={250} color="#7b2fff" />
        <MacroCard label="Fat" value={totals.fat.toFixed(0)} unit="g" target={80} color="#ff6b35" />
        <MacroCard label="Water" value={(water / 1000).toFixed(2)} unit="L" target={3} color="#60a5fa" />
      </div>

      {showWater && (
        <form onSubmit={handleWater} className="card border-blue-500/20 flex items-end gap-3">
          <div><label className="label">Amount (ml)</label>
            <div className="flex gap-2">
              {[250, 500, 750].map(v => <button key={v} type="button" onClick={() => setWaterAmt(v)} className={`px-3 py-1.5 rounded text-sm ${waterAmt === v ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'btn-secondary'}`}>{v}ml</button>)}
              <input type="number" className="input w-24" value={waterAmt} onChange={e => setWaterAmt(Number(e.target.value))} />
            </div>
          </div>
          <button type="submit" className="btn-primary">Log Water</button>
          <button type="button" onClick={() => setShowWater(false)} className="btn-secondary">Cancel</button>
        </form>
      )}

      {showMeal && (
        <form onSubmit={handleSubmit} className="card border-cyan/20 space-y-4">
          <div className="font-semibold text-white">Log Meal / Food</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="label">Meal Name</label>
              <div className="flex gap-1 flex-wrap mb-1">
                {MEAL_PRESETS.map(p => <button key={p} type="button" onClick={() => setForm(f => ({ ...f, meal_name: p }))} className={`text-xs px-2 py-0.5 rounded ${form.meal_name === p ? 'bg-cyan/20 text-cyan' : 'bg-surface text-muted'}`}>{p}</button>)}
              </div>
              <input className="input" value={form.meal_name} onChange={e => setForm(f => ({ ...f, meal_name: e.target.value }))} />
            </div>
            <div><label className="label">Date</label><input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label className="label">Time</label>
              <select className="input" value={form.logged_at_hour} onChange={e => setForm(f => ({ ...f, logged_at_hour: Number(e.target.value) }))}>
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{fmtH(i)}</option>)}
              </select>
            </div>
            <div><label className="label">Calories (kcal)</label><input type="number" step="1" className="input" placeholder="0" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} /></div>
            <div><label className="label">Protein (g)</label><input type="number" step="0.1" className="input" placeholder="0" value={form.protein_g} onChange={e => setForm(f => ({ ...f, protein_g: e.target.value }))} /></div>
            <div><label className="label">Carbs (g)</label><input type="number" step="0.1" className="input" placeholder="0" value={form.carbs_g} onChange={e => setForm(f => ({ ...f, carbs_g: e.target.value }))} /></div>
            <div><label className="label">Fat (g)</label><input type="number" step="0.1" className="input" placeholder="0" value={form.fat_g} onChange={e => setForm(f => ({ ...f, fat_g: e.target.value }))} /></div>
            <div><label className="label">Fiber (g)</label><input type="number" step="0.1" className="input" placeholder="0" value={form.fiber_g} onChange={e => setForm(f => ({ ...f, fiber_g: e.target.value }))} /></div>
            <div><label className="label">Sugar (g)</label><input type="number" step="0.1" className="input" placeholder="0" value={form.sugar_g} onChange={e => setForm(f => ({ ...f, sugar_g: e.target.value }))} /></div>
            <div><label className="label">Sodium (mg)</label><input type="number" step="1" className="input" placeholder="0" value={form.sodium_mg} onChange={e => setForm(f => ({ ...f, sodium_mg: e.target.value }))} /></div>
            <div><label className="label">Notes</label><input type="text" className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Log Meal'}</button>
            <button type="button" onClick={() => setShowMeal(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {/* Meals list */}
      <div className="card">
        <div className="section-header">Today's Meals</div>
        {meals.length === 0 ? (
          <div className="text-muted text-sm text-center py-8">No meals logged today. Start tracking your nutrition!</div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-6 text-xs text-muted px-3 pb-1">
              <div>Meal</div><div className="text-right">Cal</div><div className="text-right">Prot</div><div className="text-right">Carb</div><div className="text-right">Fat</div><div></div>
            </div>
            {meals.map(m => (
              <div key={m.id} className="grid grid-cols-6 items-center gap-2 p-3 bg-surface rounded-lg text-sm">
                <div>
                  <div className="text-white font-medium">{m.meal_name || 'Meal'}</div>
                  {m.logged_at_hour != null && <div className="text-xs text-muted">{fmtH(m.logged_at_hour)}</div>}
                </div>
                <div className="text-right font-mono text-amber">{m.calories.toFixed(0)}</div>
                <div className="text-right font-mono text-cyan">{m.protein_g.toFixed(0)}g</div>
                <div className="text-right font-mono text-violet">{m.carbs_g.toFixed(0)}g</div>
                <div className="text-right font-mono text-orange-400">{m.fat_g.toFixed(0)}g</div>
                <div className="text-right">
                  <button onClick={() => deleteMeal(m.id).then(load)} className="text-muted hover:text-rose"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
            {/* Totals */}
            <div className="grid grid-cols-6 items-center gap-2 p-3 bg-card rounded-lg text-sm font-semibold border border-border">
              <div className="text-muted">Total</div>
              <div className="text-right font-mono text-amber">{totals.cal.toFixed(0)}</div>
              <div className="text-right font-mono text-cyan">{totals.pro.toFixed(0)}g</div>
              <div className="text-right font-mono text-violet">{totals.carb.toFixed(0)}g</div>
              <div className="text-right font-mono text-orange-400">{totals.fat.toFixed(0)}g</div>
              <div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MacroCard({ label, value, unit, target, color }: { label: string; value: string; unit: string; target: number; color: string }) {
  const pct = Math.min(1, parseFloat(value) / target)
  return (
    <div className="card text-center">
      <div className="text-xs text-muted uppercase tracking-wider mb-2">{label}</div>
      <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
      <div className="text-xs text-muted">{unit}</div>
      <div className="h-1 bg-surface rounded-full mt-2 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <div className="text-xs text-muted mt-1">{(pct * 100).toFixed(0)}% of {target}{unit}</div>
    </div>
  )
}

function fmtH(h: number) {
  if (h === 0) return '12:00 AM'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}
