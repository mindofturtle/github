from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, timedelta
from database import get_db
from peak_calculator import calculate_peak_windows
import models, schemas

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/", response_model=schemas.DashboardData)
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    user = _ensure_user(db)

    sleep = db.query(models.SleepLog).filter(
        models.SleepLog.user_id == 1, models.SleepLog.date == today
    ).first()
    if not sleep:
        # Use yesterday's sleep as proxy
        sleep = db.query(models.SleepLog).filter(
            models.SleepLog.user_id == 1,
            models.SleepLog.date == today - timedelta(days=1)
        ).first()

    recovery = db.query(models.RecoveryLog).filter(
        models.RecoveryLog.user_id == 1, models.RecoveryLog.date == today
    ).first()

    stimulants = db.query(models.StimulantLog).filter(
        models.StimulantLog.user_id == 1, models.StimulantLog.date == today
    ).all()

    stim_list = [
        {"taken_at_hour": s.taken_at_hour, "amount_mg": s.amount_mg, "half_life_hours": s.half_life_hours}
        for s in stimulants
    ]

    recovery_dict = None
    if recovery:
        recovery_dict = {
            "muscle_soreness": recovery.muscle_soreness,
            "energy_level": recovery.energy_level,
            "stress_level": recovery.stress_level,
            "mood_score": recovery.mood_score,
        }

    peak_windows = calculate_peak_windows(
        log_date=today,
        wake_hour=sleep.wake_hour if sleep else user.default_wake_hour,
        sleep_duration=sleep.total_duration_hours if sleep else None,
        sleep_quality=sleep.quality_score if sleep else None,
        hrv_morning=sleep.hrv_morning if sleep else None,
        hrv_baseline=user.hrv_baseline,
        chronotype=user.chronotype,
        stimulants=stim_list,
        recovery=recovery_dict,
    )

    # Nutrition summary
    meals = db.query(models.NutritionLog).filter(
        models.NutritionLog.user_id == 1, models.NutritionLog.date == today
    ).all()
    water_ml = db.query(func.sum(models.WaterLog.amount_ml)).filter(
        models.WaterLog.user_id == 1, models.WaterLog.date == today
    ).scalar() or 0
    nutrition_summary = schemas.NutritionSummary(
        date=today,
        total_calories=sum(m.calories for m in meals),
        total_protein=sum(m.protein_g for m in meals),
        total_carbs=sum(m.carbs_g for m in meals),
        total_fat=sum(m.fat_g for m in meals),
        total_fiber=sum(m.fiber_g for m in meals),
        total_water_ml=float(water_ml),
        meal_count=len(meals),
    )

    # Recent workouts
    cutoff = today - timedelta(days=7)
    workouts = (
        db.query(models.WorkoutSession)
        .filter(models.WorkoutSession.user_id == 1, models.WorkoutSession.date >= cutoff)
        .order_by(desc(models.WorkoutSession.date))
        .limit(5)
        .all()
    )

    # Goals
    goals = db.query(models.Goal).filter(
        models.Goal.user_id == 1, models.Goal.is_active == True
    ).order_by(models.Goal.priority).all()

    # Supplements today
    supps = db.query(models.SupplementLog).filter(
        models.SupplementLog.user_id == 1, models.SupplementLog.date == today
    ).all()

    # Streaks
    streaks = _calculate_streaks(db, today)

    # Today's plan (rule-based, AI can override)
    todays_plan = _build_daily_plan(peak_windows, recovery_dict, sleep, workouts)

    return schemas.DashboardData(
        user=schemas.UserResponse.model_validate(user),
        today=today,
        peak_windows=peak_windows,
        todays_plan=todays_plan,
        nutrition_summary=nutrition_summary,
        sleep_last_night=schemas.SleepLogResponse.model_validate(sleep) if sleep else None,
        recovery_today=_recovery_response(recovery),
        active_goals=[_enrich_goal(g) for g in goals],
        recent_workouts=[],
        supplements_today=[schemas.SupplementLogResponse.model_validate(s) for s in supps],
        stimulants_today=[schemas.StimulantLogResponse.model_validate(s) for s in stimulants],
        streaks=streaks,
    )


def _ensure_user(db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.id == 1).first()
    if not user:
        user = models.User(id=1)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def _recovery_response(r):
    if not r:
        return None
    from routers.recovery import _compute_score
    resp = schemas.RecoveryLogResponse.model_validate(r)
    resp.recovery_score = _compute_score(r)
    return resp


def _enrich_goal(g: models.Goal) -> schemas.GoalResponse:
    pct = None
    if g.target_value and g.current_value is not None and g.target_value > 0:
        pct = round((g.current_value / g.target_value) * 100, 1)
    return schemas.GoalResponse(
        id=g.id, user_id=g.user_id, name=g.name, category=g.category,
        target_value=g.target_value, current_value=g.current_value,
        unit=g.unit, deadline=g.deadline, priority=g.priority, notes=g.notes,
        is_active=g.is_active, progress_pct=pct, created_at=g.created_at,
    )


def _calculate_streaks(db: Session, today: date) -> dict:
    streaks = {}
    # Workout streak
    streak = 0
    check = today
    for _ in range(60):
        exists = db.query(models.WorkoutSession).filter(
            models.WorkoutSession.user_id == 1, models.WorkoutSession.date == check
        ).first()
        if exists:
            streak += 1
            check -= timedelta(days=1)
        else:
            break
    streaks["workout_streak"] = streak

    # Logging streak (any log entry)
    streak = 0
    check = today
    for _ in range(60):
        has_log = (
            db.query(models.NutritionLog).filter(models.NutritionLog.user_id == 1, models.NutritionLog.date == check).first()
            or db.query(models.SleepLog).filter(models.SleepLog.user_id == 1, models.SleepLog.date == check).first()
            or db.query(models.RecoveryLog).filter(models.RecoveryLog.user_id == 1, models.RecoveryLog.date == check).first()
        )
        if has_log:
            streak += 1
            check -= timedelta(days=1)
        else:
            break
    streaks["logging_streak"] = streak

    return streaks


def _build_daily_plan(peak, recovery_dict, sleep, recent_workouts) -> list:
    plan = []
    readiness = peak.overall_readiness

    focus_h = peak.recommended_focus_hour
    gym_h = peak.recommended_gym_hour

    def fmt(h):
        if h == 0: return "12 AM"
        if h < 12: return f"{h}:00 AM"
        if h == 12: return "12 PM"
        return f"{h-12}:00 PM"

    plan.append(f"Mental focus window opens at {fmt(focus_h)} — block your hardest task here")
    intensity = "go hard" if readiness >= 70 else "keep it moderate"
    plan.append(f"Optimal training window: {fmt(gym_h)} — {intensity}")
    plan.append(f"Readiness score: {readiness:.0f}/100 — {peak.readiness_label}")

    if sleep and sleep.total_duration_hours and sleep.total_duration_hours < 6.5:
        plan.append("⚠ Sleep debt detected — prioritize 20-30 min nap before 3 PM")
    if sleep and sleep.hrv_morning and sleep.hrv_morning < 40:
        plan.append("⚠ Low HRV — nervous system stressed, consider lighter training")
    if recovery_dict and (recovery_dict.get("stress_level") or 5) >= 8:
        plan.append("⚠ High stress — limit caffeine after noon, prioritize recovery")

    plan.append(f"Hydration goal: 3L water — start first 500ml within 30 min of waking")

    return plan[:7]
