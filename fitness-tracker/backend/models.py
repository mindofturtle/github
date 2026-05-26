from sqlalchemy import Column, Integer, Float, String, Text, DateTime, Boolean, Date, Time, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="Athlete")
    age = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    sex = Column(String(10), nullable=True)
    chronotype = Column(String(20), default="intermediate")  # morning/intermediate/evening
    default_wake_hour = Column(Float, default=7.0)
    default_sleep_hour = Column(Float, default=23.0)
    hrv_baseline = Column(Float, default=50.0)
    resting_hr_baseline = Column(Float, default=60.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sleep_logs = relationship("SleepLog", back_populates="user")
    workout_sessions = relationship("WorkoutSession", back_populates="user")
    nutrition_logs = relationship("NutritionLog", back_populates="user")
    water_logs = relationship("WaterLog", back_populates="user")
    supplement_logs = relationship("SupplementLog", back_populates="user")
    stimulant_logs = relationship("StimulantLog", back_populates="user")
    heart_logs = relationship("HeartLog", back_populates="user")
    goals = relationship("Goal", back_populates="user")
    recovery_logs = relationship("RecoveryLog", back_populates="user")


class SleepLog(Base):
    __tablename__ = "sleep_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    date = Column(Date, nullable=False, index=True)
    bedtime_hour = Column(Float, nullable=True)
    wake_hour = Column(Float, nullable=True)
    total_duration_hours = Column(Float, nullable=True)
    quality_score = Column(Integer, nullable=True)   # 1-10
    deep_sleep_hours = Column(Float, nullable=True)
    rem_sleep_hours = Column(Float, nullable=True)
    light_sleep_hours = Column(Float, nullable=True)
    awakenings = Column(Integer, default=0)
    hrv_morning = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="sleep_logs")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    date = Column(Date, nullable=False, index=True)
    session_type = Column(String(50), nullable=False)  # push/pull/legs/upper/lower/full/cardio/rest
    duration_minutes = Column(Integer, nullable=True)
    intensity_score = Column(Integer, nullable=True)   # 1-10
    perceived_exertion = Column(Integer, nullable=True)  # RPE 1-10
    volume_total = Column(Float, nullable=True)  # total kg lifted
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="workout_sessions")
    exercise_sets = relationship("ExerciseSet", back_populates="session", cascade="all, delete-orphan")


class Exercise(Base):
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    category = Column(String(50), nullable=True)      # push/pull/legs/cardio/core
    primary_muscle = Column(String(100), nullable=True)
    secondary_muscles = Column(String(200), nullable=True)
    is_compound = Column(Boolean, default=True)

    sets = relationship("ExerciseSet", back_populates="exercise")


class ExerciseSet(Base):
    __tablename__ = "exercise_sets"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"))
    exercise_id = Column(Integer, ForeignKey("exercises.id"))
    set_number = Column(Integer, nullable=False)
    weight_kg = Column(Float, default=0)
    reps = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # for timed exercises
    rpe = Column(Float, nullable=True)  # 1-10
    is_pr = Column(Boolean, default=False)

    session = relationship("WorkoutSession", back_populates="exercise_sets")
    exercise = relationship("Exercise", back_populates="sets")


class NutritionLog(Base):
    __tablename__ = "nutrition_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    date = Column(Date, nullable=False, index=True)
    meal_name = Column(String(100), nullable=True)
    calories = Column(Float, default=0)
    protein_g = Column(Float, default=0)
    carbs_g = Column(Float, default=0)
    fat_g = Column(Float, default=0)
    fiber_g = Column(Float, default=0)
    sugar_g = Column(Float, default=0)
    sodium_mg = Column(Float, default=0)
    logged_at_hour = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="nutrition_logs")


class WaterLog(Base):
    __tablename__ = "water_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    date = Column(Date, nullable=False, index=True)
    amount_ml = Column(Float, nullable=False)
    logged_at_hour = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="water_logs")


class SupplementLog(Base):
    __tablename__ = "supplement_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    date = Column(Date, nullable=False, index=True)
    supplement_name = Column(String(100), nullable=False)
    dosage = Column(Float, nullable=True)
    unit = Column(String(20), default="mg")
    taken_at_hour = Column(Float, nullable=True)
    category = Column(String(50), nullable=True)  # vitamin/mineral/performance/recovery/nootropic
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="supplement_logs")


class StimulantLog(Base):
    __tablename__ = "stimulant_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    date = Column(Date, nullable=False, index=True)
    stimulant_type = Column(String(50), nullable=False)  # caffeine/pre-workout/adderall/etc
    amount_mg = Column(Float, nullable=True)
    taken_at_hour = Column(Float, nullable=False)
    half_life_hours = Column(Float, default=5.0)  # caffeine ~5h, pre-workout varies
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="stimulant_logs")


class HeartLog(Base):
    __tablename__ = "heart_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    date = Column(Date, nullable=False, index=True)
    resting_hr = Column(Float, nullable=True)
    max_hr_today = Column(Float, nullable=True)
    hrv = Column(Float, nullable=True)
    hrv_rmssd = Column(Float, nullable=True)
    spo2 = Column(Float, nullable=True)
    vo2max = Column(Float, nullable=True)
    blood_pressure_systolic = Column(Integer, nullable=True)
    blood_pressure_diastolic = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="heart_logs")


class Goal(Base):
    __tablename__ = "goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)  # strength/body_comp/endurance/nutrition/habit/mental
    target_value = Column(Float, nullable=True)
    current_value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    deadline = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    priority = Column(Integer, default=3)  # 1=critical, 5=low
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="goals")


class RecoveryLog(Base):
    __tablename__ = "recovery_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), default=1)
    date = Column(Date, nullable=False, index=True)
    muscle_soreness = Column(Integer, nullable=True)  # 1-10 (1=none, 10=extreme)
    energy_level = Column(Integer, nullable=True)     # 1-10
    stress_level = Column(Integer, nullable=True)     # 1-10
    mood_score = Column(Integer, nullable=True)       # 1-10
    motivation_score = Column(Integer, nullable=True) # 1-10
    cognitive_clarity = Column(Integer, nullable=True)# 1-10
    injuries = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recovery_logs")
