import { useEffect, useState } from 'react'
import { Plus, Trash2, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { logSupplement, getTodaySupplements, deleteSupplement, logStimulant, getTodayStimulants, deleteStimulant, SupplementLog, StimulantLog } from '../api/client'

const SUPP_CATS = ['vitamin', 'mineral', 'performance', 'recovery', 'nootropic', 'hormone', 'other']
const COMMON_SUPPS = ['Creatine', 'Vitamin D3', 'Magnesium Glycinate', 'Omega-3', 'Zinc', 'Vitamin C', 'B12', 'Ashwagandha', 'L-Theanine', 'NMN', 'Collagen', 'Protein Powder']
const COMMON_STIMS = ['Coffee', 'Espresso', 'Caffeine Pill', 'Pre-Workout', 'Energy Drink', 'Green Tea', 'Matcha', 'Modafinil', 'Nicotine']

function fmtH(h: number) {
  if (h === 0) return '12:00 AM'
  if (h < 12) return `${h}:00 AM`
  if (h === 12) return '12:00 PM'
  return `${h - 12}:00 PM`
}

export default function SupplementTracker() {
  const [supplements, setSupplements] = useState<SupplementLog[]>([])
  const [stimulants, setStimulants] = useState<StimulantLog[]>([])
  const [showSupp, setShowSupp] = useState(false)
  const [showStim, setShowStim] = useState(false)
  const [saving, setSaving] = useState(false)

  const [suppForm, setSuppForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), supplement_name: '', dosage: '', unit: 'mg', taken_at_hour: new Date().getHours(), category: 'vitamin', notes: '' })
  const [stimForm, setStimForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), stimulant_type: 'Coffee', amount_mg: '100', taken_at_hour: new Date().getHours(), half_life_hours: 5, notes: '' })

  const load = () => Promise.all([getTodaySupplements(), getTodayStimulants()]).then(([s, st]) => { setSupplements(s); setStimulants(st) })
  useEffect(() => { load() }, [])

  const handleSupp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await logSupplement({ ...suppForm, dosage: suppForm.dosage ? parseFloat(suppForm.dosage) : null })
      setShowSupp(false)
      load()
    } finally { setSaving(false) }
  }

  const handleStim = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await logStimulant({ ...stimForm, amount_mg: stimForm.amount_mg ? parseFloat(stimForm.amount_mg) : null })
      setShowStim(false)
      load()
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Supplements & Stimulants</h1><p className="text-sm text-muted">Track intake timing for peak window optimization</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowStim(!showStim)} className="btn-secondary flex items-center gap-1"><Zap size={14} className="text-amber" />+Stimulant</button>
          <button onClick={() => setShowSupp(!showSupp)} className="btn-primary flex items-center gap-2"><Plus size={14} />+Supplement</button>
        </div>
      </div>

      {showStim && (
        <form onSubmit={handleStim} className="card border-amber/20 space-y-3">
          <div className="font-semibold text-amber flex items-center gap-2"><Zap size={14} />Log Stimulant</div>
          <div className="text-xs text-muted bg-amber/5 border border-amber/20 rounded p-2">
            Stimulant timing is used to calculate your peak performance windows throughout the day.
          </div>
          <div className="flex gap-2 flex-wrap mb-2">
            {COMMON_STIMS.map(s => (
              <button key={s} type="button" onClick={() => setStimForm(f => ({
                ...f, stimulant_type: s,
                amount_mg: s === 'Coffee' ? '100' : s === 'Espresso' ? '80' : s === 'Pre-Workout' ? '300' : s === 'Energy Drink' ? '160' : s === 'Caffeine Pill' ? '200' : '100',
                half_life_hours: s === 'Green Tea' || s === 'Matcha' ? 4 : s === 'Nicotine' ? 2 : s === 'Modafinil' ? 12 : 5,
              }))} className={`text-xs px-2 py-1 rounded ${stimForm.stimulant_type === s ? 'bg-amber/20 text-amber border border-amber/40' : 'bg-surface text-muted'}`}>{s}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="label">Type</label><input required className="input" value={stimForm.stimulant_type} onChange={e => setStimForm(f => ({ ...f, stimulant_type: e.target.value }))} /></div>
            <div><label className="label">Caffeine/Active (mg)</label><input type="number" className="input" value={stimForm.amount_mg} onChange={e => setStimForm(f => ({ ...f, amount_mg: e.target.value }))} /></div>
            <div><label className="label">Time Taken</label><select className="input" value={stimForm.taken_at_hour} onChange={e => setStimForm(f => ({ ...f, taken_at_hour: Number(e.target.value) }))}>{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{fmtH(i)}</option>)}</select></div>
            <div><label className="label">Half-life (hrs)</label><input type="number" step="0.5" className="input" value={stimForm.half_life_hours} onChange={e => setStimForm(f => ({ ...f, half_life_hours: Number(e.target.value) }))} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Log Stimulant'}</button>
            <button type="button" onClick={() => setShowStim(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {showSupp && (
        <form onSubmit={handleSupp} className="card border-cyan/20 space-y-3">
          <div className="font-semibold text-white">Log Supplement</div>
          <div className="flex gap-2 flex-wrap mb-2">
            {COMMON_SUPPS.map(s => (
              <button key={s} type="button" onClick={() => setSuppForm(f => ({ ...f, supplement_name: s }))} className={`text-xs px-2 py-1 rounded ${suppForm.supplement_name === s ? 'bg-cyan/20 text-cyan border border-cyan/40' : 'bg-surface text-muted'}`}>{s}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="label">Supplement</label><input required className="input" value={suppForm.supplement_name} onChange={e => setSuppForm(f => ({ ...f, supplement_name: e.target.value }))} /></div>
            <div><label className="label">Dosage</label><input type="number" step="any" className="input" value={suppForm.dosage} onChange={e => setSuppForm(f => ({ ...f, dosage: e.target.value }))} /></div>
            <div><label className="label">Unit</label><select className="input" value={suppForm.unit} onChange={e => setSuppForm(f => ({ ...f, unit: e.target.value }))}><option>mg</option><option>g</option><option>IU</option><option>mcg</option><option>ml</option><option>serving</option></select></div>
            <div><label className="label">Category</label><select className="input" value={suppForm.category} onChange={e => setSuppForm(f => ({ ...f, category: e.target.value }))}>{SUPP_CATS.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label">Time Taken</label><select className="input" value={suppForm.taken_at_hour} onChange={e => setSuppForm(f => ({ ...f, taken_at_hour: Number(e.target.value) }))}>{Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{fmtH(i)}</option>)}</select></div>
            <div><label className="label">Notes</label><input type="text" className="input" value={suppForm.notes} onChange={e => setSuppForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Log Supplement'}</button>
            <button type="button" onClick={() => setShowSupp(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stimulants */}
        <div className="card">
          <div className="section-header"><Zap size={14} className="text-amber" />Today's Stimulants</div>
          {stimulants.length === 0 ? (
            <div className="text-muted text-sm text-center py-6">No stimulants logged today</div>
          ) : (
            <div className="space-y-2">
              {stimulants.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 bg-surface rounded-lg text-sm">
                  <div className="flex-1">
                    <div className="font-medium text-amber">{s.stimulant_type}</div>
                    <div className="text-xs text-muted">{s.amount_mg}mg @ {fmtH(s.taken_at_hour)} · half-life {s.half_life_hours}h</div>
                  </div>
                  <button onClick={() => deleteStimulant(s.id).then(load)} className="text-muted hover:text-rose"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Supplements */}
        <div className="card">
          <div className="section-header"><Plus size={14} className="text-cyan" />Today's Supplements</div>
          {supplements.length === 0 ? (
            <div className="text-muted text-sm text-center py-6">No supplements logged today</div>
          ) : (
            <div className="space-y-2">
              {supplements.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 bg-surface rounded-lg text-sm">
                  <div className="flex-1">
                    <div className="font-medium text-white">{s.supplement_name}</div>
                    <div className="text-xs text-muted">{s.dosage}{s.unit} · {s.category} · {fmtH(s.taken_at_hour || 0)}</div>
                  </div>
                  <button onClick={() => deleteSupplement(s.id).then(load)} className="text-muted hover:text-rose"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
