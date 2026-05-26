import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export default api

// Types mirroring backend schemas

export interface User {
  id: number
  name: string
  age?: number
  weight_kg?: number
  height_cm?: number
  sex?: string
  chronotype: string
  default_wake_hour: number
  default_sleep_hour: number
  hrv_baseline: number
  resting_hr_baseline: number
  created_at: string
}

export interface HourlyScore {
  hour: number
  mental: number
  physical: number
  combined: number
  label: string
}

export interface PeakWindowResult {
  date: string
  hourly_scores: HourlyScore[]
  mental_peak_hour: number
  physical_peak_hour: number
  mental_peak_score: number
  physical_peak_score: number
  overall_readiness: number
  readiness_label: string
  recommended_gym_hour: number
  recommended_focus_hour: number
  gym_recommendation: string
  focus_recommendation: string
  stimulant_window?: string
  sleep_debt_hours: number
  factors: Record<string, unknown>
}

export interface NutritionSummary {
  date: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  total_water_ml: number
  meal_count: number
}

export interface SleepLog {
  id: number
  user_id: number
  date: string
  bedtime_hour?: number
  wake_hour?: number
  total_duration_hours?: number
  quality_score?: number
  deep_sleep_hours?: number
  rem_sleep_hours?: number
  light_sleep_hours?: number
  awakenings: number
  hrv_morning?: number
  notes?: string
  created_at: string
}

export interface RecoveryLog {
  id: number
  user_id: number
  date: string
  muscle_soreness?: number
  energy_level?: number
  stress_level?: number
  mood_score?: number
  motivation_score?: number
  cognitive_clarity?: number
  injuries?: string
  notes?: string
  recovery_score?: number
  created_at: string
}

export interface Goal {
  id: number
  user_id: number
  name: string
  category: string
  target_value?: number
  current_value?: number
  unit?: string
  deadline?: string
  priority: number
  notes?: string
  is_active: boolean
  progress_pct?: number
  created_at: string
}

export interface WorkoutSession {
  id: number
  user_id: number
  date: string
  session_type: string
  duration_minutes?: number
  intensity_score?: number
  perceived_exertion?: number
  volume_total?: number
  notes?: string
  created_at: string
  exercise_sets: ExerciseSet[]
}

export interface ExerciseSet {
  id: number
  session_id: number
  exercise_id: number
  set_number: number
  weight_kg: number
  reps?: number
  duration_seconds?: number
  rpe?: number
  is_pr: boolean
  exercise_name?: string
}

export interface Exercise {
  id: number
  name: string
  category?: string
  primary_muscle?: string
  secondary_muscles?: string
  is_compound: boolean
}

export interface NutritionLog {
  id: number
  user_id: number
  date: string
  meal_name?: string
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  sugar_g: number
  sodium_mg: number
  logged_at_hour?: number
  notes?: string
  created_at: string
}

export interface SupplementLog {
  id: number
  user_id: number
  date: string
  supplement_name: string
  dosage?: number
  unit: string
  taken_at_hour?: number
  category?: string
  notes?: string
  created_at: string
}

export interface StimulantLog {
  id: number
  user_id: number
  date: string
  stimulant_type: string
  amount_mg?: number
  taken_at_hour: number
  half_life_hours: number
  notes?: string
  created_at: string
}

export interface HeartLog {
  id: number
  user_id: number
  date: string
  resting_hr?: number
  max_hr_today?: number
  hrv?: number
  hrv_rmssd?: number
  spo2?: number
  vo2max?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  notes?: string
  created_at: string
}

export interface DashboardData {
  user: User
  today: string
  peak_windows: PeakWindowResult
  todays_plan: string[]
  nutrition_summary: NutritionSummary
  sleep_last_night?: SleepLog
  recovery_today?: RecoveryLog
  active_goals: Goal[]
  recent_workouts: WorkoutSession[]
  supplements_today: SupplementLog[]
  stimulants_today: StimulantLog[]
  streaks: Record<string, number>
}

export interface AIAnalysis {
  analysis_type: string
  body_state_summary: string
  peak_window_explanation: string
  todays_recommendations: string[]
  workout_advice: string
  nutrition_advice: string
  recovery_advice: string
  mental_performance_tips: string[]
  alerts: string[]
  generated_at: string
}

// API calls
export const getUser = () => api.get<User>('/users/me').then(r => r.data)
export const updateUser = (data: Partial<User>) => api.put<User>('/users/me', data).then(r => r.data)

export const getDashboard = () => api.get<DashboardData>('/dashboard').then(r => r.data)

export const logSleep = (data: object) => api.post<SleepLog>('/sleep', data).then(r => r.data)
export const getSleepHistory = (limit = 30) => api.get<SleepLog[]>(`/sleep?limit=${limit}`).then(r => r.data)

export const logRecovery = (data: object) => api.post<RecoveryLog>('/recovery', data).then(r => r.data)
export const getRecoveryHistory = () => api.get<RecoveryLog[]>('/recovery').then(r => r.data)

export const logMeal = (data: object) => api.post<NutritionLog>('/nutrition', data).then(r => r.data)
export const getTodayMeals = () => api.get<NutritionLog[]>('/nutrition/today').then(r => r.data)
export const deleteMeal = (id: number) => api.delete(`/nutrition/${id}`)
export const logWater = (data: object) => api.post('/nutrition/water', data).then(r => r.data)
export const getTodayWater = () => api.get<{ total_ml: number; total_liters: number }>('/nutrition/water/today').then(r => r.data)

export const getExercises = () => api.get<Exercise[]>('/workouts/exercises').then(r => r.data)
export const createExercise = (data: object) => api.post<Exercise>('/workouts/exercises', data).then(r => r.data)
export const logWorkout = (data: object) => api.post<WorkoutSession>('/workouts/sessions', data).then(r => r.data)
export const getWorkouts = (days = 30) => api.get<WorkoutSession[]>(`/workouts/sessions?days=${days}`).then(r => r.data)
export const deleteWorkout = (id: number) => api.delete(`/workouts/sessions/${id}`)
export const getOverloadHistory = (exerciseId: number) => api.get(`/workouts/progressive-overload/${exerciseId}`).then(r => r.data)

export const logSupplement = (data: object) => api.post<SupplementLog>('/supplements', data).then(r => r.data)
export const getTodaySupplements = () => api.get<SupplementLog[]>('/supplements/today').then(r => r.data)
export const deleteSupplement = (id: number) => api.delete(`/supplements/${id}`)
export const logStimulant = (data: object) => api.post<StimulantLog>('/supplements/stimulants', data).then(r => r.data)
export const getTodayStimulants = () => api.get<StimulantLog[]>('/supplements/stimulants/today').then(r => r.data)
export const deleteStimulant = (id: number) => api.delete(`/supplements/stimulants/${id}`)

export const logHeart = (data: object) => api.post<HeartLog>('/heart', data).then(r => r.data)
export const getHeartHistory = () => api.get<HeartLog[]>('/heart').then(r => r.data)

export const getGoals = () => api.get<Goal[]>('/goals').then(r => r.data)
export const createGoal = (data: object) => api.post<Goal>('/goals', data).then(r => r.data)
export const updateGoal = (id: number, data: object) => api.put<Goal>(`/goals/${id}`, data).then(r => r.data)
export const deleteGoal = (id: number) => api.delete(`/goals/${id}`)

export const runAIAnalysis = () => api.post<AIAnalysis>('/ai/analyze', { user_id: 1, analysis_type: 'full' }).then(r => r.data)
export const getAIWorkoutPlan = () => api.post('/ai/workout-plan').then(r => r.data)
