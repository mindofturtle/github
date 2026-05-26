from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


class UserBase(BaseModel):
    name: str = "Athlete"
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    sex: Optional[str] = None
    chronotype: str = "intermediate"
    default_wake_hour: float = 7.0
    default_sleep_hour: float = 23.0
    hrv_baseline: float = 50.0
    resting_hr_baseline: float = 60.0


class UserCreate(UserBase):
    pass


class UserUpdate(UserBase):
    pass


class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Sleep

class SleepLogCreate(BaseModel):
    date: date
    bedtime_hour: Optional[float] = None
    wake_hour: Optional[float] = None
    total_duration_hours: Optional[float] = None
    quality_score: Optional[int] = Field(None, ge=1, le=10)
    deep_sleep_hours: Optional[float] = None
    rem_sleep_hours: Optional[float] = None
    light_sleep_hours: Optional[float] = None
    awakenings: int = 0
    hrv_morning: Optional[float] = None
    notes: Optional[str] = None


class SleepLogResponse(SleepLogCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Workout

class ExerciseSetCreate(BaseModel):
    exercise_id: int
    set_number: int
    weight_kg: float = 0
    reps: Optional[int] = None
    duration_seconds: Optional[int] = None
    rpe: Optional[float] = None
    is_pr: bool = False


class ExerciseSetResponse(ExerciseSetCreate):
    id: int
    session_id: int
    exercise_name: Optional[str] = None

    class Config:
        from_attributes = True


class WorkoutSessionCreate(BaseModel):
    date: date
    session_type: str
    duration_minutes: Optional[int] = None
    intensity_score: Optional[int] = Field(None, ge=1, le=10)
    perceived_exertion: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None
    sets: List[ExerciseSetCreate] = []


class WorkoutSessionResponse(BaseModel):
    id: int
    user_id: int
    date: date
    session_type: str
    duration_minutes: Optional[int]
    intensity_score: Optional[int]
    perceived_exertion: Optional[int]
    volume_total: Optional[float]
    notes: Optional[str]
    created_at: datetime
    exercise_sets: List[ExerciseSetResponse] = []

    class Config:
        from_attributes = True


class ExerciseCreate(BaseModel):
    name: str
    category: Optional[str] = None
    primary_muscle: Optional[str] = None
    secondary_muscles: Optional[str] = None
    is_compound: bool = True


class ExerciseResponse(ExerciseCreate):
    id: int

    class Config:
        from_attributes = True


# Nutrition

class NutritionLogCreate(BaseModel):
    date: date
    meal_name: Optional[str] = None
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0
    sugar_g: float = 0
    sodium_mg: float = 0
    logged_at_hour: Optional[float] = None
    notes: Optional[str] = None


class NutritionLogResponse(NutritionLogCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class NutritionSummary(BaseModel):
    date: date
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    total_water_ml: float
    meal_count: int


# Water

class WaterLogCreate(BaseModel):
    date: date
    amount_ml: float
    logged_at_hour: Optional[float] = None


class WaterLogResponse(WaterLogCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Supplements

class SupplementLogCreate(BaseModel):
    date: date
    supplement_name: str
    dosage: Optional[float] = None
    unit: str = "mg"
    taken_at_hour: Optional[float] = None
    category: Optional[str] = None
    notes: Optional[str] = None


class SupplementLogResponse(SupplementLogCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Stimulants

class StimulantLogCreate(BaseModel):
    date: date
    stimulant_type: str
    amount_mg: Optional[float] = None
    taken_at_hour: float
    half_life_hours: float = 5.0
    notes: Optional[str] = None


class StimulantLogResponse(StimulantLogCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Heart

class HeartLogCreate(BaseModel):
    date: date
    resting_hr: Optional[float] = None
    max_hr_today: Optional[float] = None
    hrv: Optional[float] = None
    hrv_rmssd: Optional[float] = None
    spo2: Optional[float] = None
    vo2max: Optional[float] = None
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    notes: Optional[str] = None


class HeartLogResponse(HeartLogCreate):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Goals

class GoalCreate(BaseModel):
    name: str
    category: str
    target_value: Optional[float] = None
    current_value: Optional[float] = None
    unit: Optional[str] = None
    deadline: Optional[date] = None
    priority: int = Field(3, ge=1, le=5)
    notes: Optional[str] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    current_value: Optional[float] = None
    target_value: Optional[float] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class GoalResponse(GoalCreate):
    id: int
    user_id: int
    is_active: bool
    progress_pct: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Recovery

class RecoveryLogCreate(BaseModel):
    date: date
    muscle_soreness: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    mood_score: Optional[int] = Field(None, ge=1, le=10)
    motivation_score: Optional[int] = Field(None, ge=1, le=10)
    cognitive_clarity: Optional[int] = Field(None, ge=1, le=10)
    injuries: Optional[str] = None
    notes: Optional[str] = None


class RecoveryLogResponse(RecoveryLogCreate):
    id: int
    user_id: int
    recovery_score: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Peak Windows

class HourlyScore(BaseModel):
    hour: int
    mental: float
    physical: float
    combined: float
    label: str


class PeakWindowResult(BaseModel):
    date: date
    hourly_scores: List[HourlyScore]
    mental_peak_hour: int
    physical_peak_hour: int
    mental_peak_score: float
    physical_peak_score: float
    overall_readiness: float
    readiness_label: str
    recommended_gym_hour: int
    recommended_focus_hour: int
    gym_recommendation: str
    focus_recommendation: str
    stimulant_window: Optional[str] = None
    sleep_debt_hours: float = 0
    factors: dict = {}


# Dashboard

class DashboardData(BaseModel):
    user: UserResponse
    today: date
    peak_windows: PeakWindowResult
    todays_plan: List[str]
    nutrition_summary: NutritionSummary
    sleep_last_night: Optional[SleepLogResponse]
    recovery_today: Optional[RecoveryLogResponse]
    active_goals: List[GoalResponse]
    recent_workouts: List[WorkoutSessionResponse]
    supplements_today: List[SupplementLogResponse]
    stimulants_today: List[StimulantLogResponse]
    streaks: dict


# AI

class AIAnalysisRequest(BaseModel):
    user_id: int = 1
    analysis_type: str = "full"  # full/workout/nutrition/recovery/peak


class AIAnalysisResponse(BaseModel):
    analysis_type: str
    body_state_summary: str
    peak_window_explanation: str
    todays_recommendations: List[str]
    workout_advice: str
    nutrition_advice: str
    recovery_advice: str
    mental_performance_tips: List[str]
    alerts: List[str]
    generated_at: datetime
