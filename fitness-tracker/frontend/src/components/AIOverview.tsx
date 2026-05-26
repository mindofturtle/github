import { useState } from 'react'
import { Brain, Zap, AlertTriangle, Dumbbell, Activity, Loader, RefreshCw } from 'lucide-react'
import { runAIAnalysis, getAIWorkoutPlan, AIAnalysis } from '../api/client'
import { format } from 'date-fns'

export default function AIOverview() {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [workoutPlan, setWorkoutPlan] = useState<any | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [loadingWorkout, setLoadingWorkout] = useState(false)
  const [error, setError] = useState('')

  const handleAnalyze = async () => {
    setLoadingAnalysis(true)
    setError('')
    try {
      const result = await runAIAnalysis()
      setAnalysis(result)
    } catch (e: any) {
      const msg = e.response?.data?.detail || e.message || 'Analysis failed'
      setError(msg.includes('ANTHROPIC_API_KEY') ? 'Add your ANTHROPIC_API_KEY to the .env file to enable AI analysis.' : msg)
    } finally {
      setLoadingAnalysis(false)
    }
  }

  const handleWorkoutPlan = async () => {
    setLoadingWorkout(true)
    setError('')
    try {
      const result = await getAIWorkoutPlan()
      setWorkoutPlan(result)
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message)
    } finally {
      setLoadingWorkout(false)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Body Overview</h1>
          <p className="text-sm text-muted mt-0.5">Powered by Claude — analyzes all your logged data for personalized insights</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleWorkoutPlan} disabled={loadingWorkout} className="btn-secondary flex items-center gap-2">
            {loadingWorkout ? <Loader size={14} className="animate-spin" /> : <Dumbbell size={14} />}
            Workout Plan
          </button>
          <button onClick={handleAnalyze} disabled={loadingAnalysis} className="btn-primary flex items-center gap-2">
            {loadingAnalysis ? <Loader size={14} className="animate-spin" /> : <Brain size={14} />}
            {analysis ? <><RefreshCw size={14} />Re-analyze</> : 'Analyze My Body'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card border-rose/30 bg-rose/5 flex items-start gap-3">
          <AlertTriangle size={16} className="text-rose mt-0.5 flex-shrink-0" />
          <p className="text-sm text-rose">{error}</p>
        </div>
      )}

      {!analysis && !loadingAnalysis && (
        <div className="card text-center py-16 border-dashed">
          <Brain size={40} className="mx-auto mb-4 text-violet opacity-50" />
          <div className="text-white font-semibold mb-2">AI Body State Analysis</div>
          <p className="text-muted text-sm max-w-md mx-auto mb-4">
            Claude will analyze all your logged data — sleep, HRV, nutrition, workouts, recovery, stimulants, and goals —
            to give you a complete picture of your current body state and exactly what to do today.
          </p>
          <button onClick={handleAnalyze} className="btn-primary mx-auto flex items-center gap-2">
            <Brain size={14} /> Run Full Analysis
          </button>
          <p className="text-xs text-muted mt-3">Requires ANTHROPIC_API_KEY in .env</p>
        </div>
      )}

      {loadingAnalysis && (
        <div className="card text-center py-16">
          <Loader size={32} className="mx-auto mb-4 text-cyan animate-spin" />
          <div className="text-white font-semibold mb-2">Analyzing your entire body state...</div>
          <p className="text-muted text-sm">Claude is processing your sleep, HRV, nutrition, workouts, and more</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-4 animate-slide-up">
          <div className="text-xs text-muted">Last analyzed: {format(new Date(analysis.generated_at), 'MMM d, yyyy h:mm a')}</div>

          {/* Alerts */}
          {analysis.alerts.length > 0 && (
            <div className="card border-rose/30 bg-rose/5">
              <div className="section-header text-rose"><AlertTriangle size={14} />Alerts & Red Flags</div>
              <div className="space-y-2">
                {analysis.alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-rose/90">
                    <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body State Summary */}
          <div className="card border-violet/20">
            <div className="section-header"><Brain size={14} className="text-violet" />Body State Summary</div>
            <p className="text-white/90 text-sm leading-relaxed">{analysis.body_state_summary}</p>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted font-medium mb-1">Peak Window Explanation</div>
              <p className="text-sm text-white/80">{analysis.peak_window_explanation}</p>
            </div>
          </div>

          {/* Today's Recommendations */}
          <div className="card border-cyan/20">
            <div className="section-header"><Zap size={14} className="text-cyan" />Today's Action Plan</div>
            <div className="space-y-2">
              {analysis.todays_recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-surface rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-cyan/10 text-cyan text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-white/90">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Three columns: Workout, Nutrition, Recovery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="section-header"><Dumbbell size={14} className="text-cyan" />Workout Advice</div>
              <p className="text-sm text-white/80 leading-relaxed">{analysis.workout_advice}</p>
            </div>
            <div className="card">
              <div className="section-header"><Utensils size={14} className="text-amber" />Nutrition Advice</div>
              <p className="text-sm text-white/80 leading-relaxed">{analysis.nutrition_advice}</p>
            </div>
            <div className="card">
              <div className="section-header"><Activity size={14} className="text-emerald-400" />Recovery Advice</div>
              <p className="text-sm text-white/80 leading-relaxed">{analysis.recovery_advice}</p>
            </div>
          </div>

          {/* Mental Performance Tips */}
          <div className="card border-violet/20">
            <div className="section-header"><Brain size={14} className="text-violet" />Mental Performance Tips</div>
            <div className="space-y-2">
              {analysis.mental_performance_tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet mt-2 flex-shrink-0" />
                  <p className="text-sm text-white/80">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workout Plan */}
      {workoutPlan && (
        <div className="card border-cyan/20 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="section-header mb-0"><Dumbbell size={14} className="text-cyan" />AI Workout Plan for Today</div>
            <div className={`badge ${workoutPlan.should_train_today ? 'badge-green' : 'badge-rose'}`}>
              {workoutPlan.should_train_today ? 'Train Today' : 'Rest/Recovery'}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="bg-surface rounded-lg p-3 text-center">
              <div className="text-xs text-muted mb-1">Session Type</div>
              <div className="font-semibold text-white capitalize">{workoutPlan.recommended_session_type}</div>
            </div>
            <div className="bg-surface rounded-lg p-3 text-center">
              <div className="text-xs text-muted mb-1">Intensity</div>
              <div className="font-semibold text-cyan">{workoutPlan.intensity_recommendation}/10</div>
            </div>
            <div className="bg-surface rounded-lg p-3 text-center">
              <div className="text-xs text-muted mb-1">Duration</div>
              <div className="font-semibold text-white">{workoutPlan.duration_recommendation_minutes} min</div>
            </div>
            <div className="bg-surface rounded-lg p-3 text-center">
              <div className="text-xs text-muted mb-1">Best Time</div>
              <div className="font-semibold text-cyan">{workoutPlan.timing_recommendation}</div>
            </div>
          </div>

          {workoutPlan.key_exercises?.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-muted uppercase tracking-wider mb-2">Key Exercises</div>
              <div className="space-y-1">
                {workoutPlan.key_exercises.map((ex: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-cyan">•</span><span className="text-white/80">{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workoutPlan.progressive_overload_notes && (
            <div className="bg-amber/5 border border-amber/20 rounded-lg p-3 text-sm text-amber mb-3">
              <div className="text-xs font-medium mb-1">Progressive Overload</div>
              {workoutPlan.progressive_overload_notes}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {workoutPlan.warm_up_protocol && (
              <div><div className="text-xs text-muted mb-1">Warm-Up</div><div className="text-white/80">{workoutPlan.warm_up_protocol}</div></div>
            )}
            {workoutPlan.cool_down_protocol && (
              <div><div className="text-xs text-muted mb-1">Cool-Down</div><div className="text-white/80">{workoutPlan.cool_down_protocol}</div></div>
            )}
          </div>

          {workoutPlan.reasoning && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-xs text-muted mb-1">Reasoning</div>
              <p className="text-sm text-white/70">{workoutPlan.reasoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Utensils({ size = 16, className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
    </svg>
  )
}
