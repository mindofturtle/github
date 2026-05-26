from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, datetime, timedelta
from typing import Optional
from database import get_db
from peak_calculator import calculate_peak_windows
import models, schemas, ai_engine

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/analyze", response_model=schemas.AIAnalysisResponse)
def run_analysis(request: schemas.AIAnalysisRequest, db: Session = Depends(get_db)):
    today = date.today()
    context_data = _gather_context(db, today)

    try:
        result = ai_engine.generate_full_analysis(ai_engine.build_user_context(context_data))
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

    return schemas.AIAnalysisResponse(
        analysis_type=request.analysis_type,
        body_state_summary=result.get("body_state_summary", ""),
        peak_window_explanation=result.get("peak_window_explanation", ""),
        todays_recommendations=result.get("todays_recommendations", []),
        workout_advice=result.get("workout_advice", ""),
        nutrition_advice=result.get("nutrition_advice", ""),
        recovery_advice=result.get("recovery_advice", ""),
        mental_performance_tips=result.get("mental_performance_tips", []),
        alerts=result.get("alerts", []),
        generated_at=datetime.now(),
    )


@router.post("/workout-plan")
def get_workout_plan(db: Session = Depends(get_db)):
    today = date.today()
    context_data = _gather_context(db, today)
    goals = [g["name"] for g in context_data.get("goals", [])]

    try:
        result = ai_engine.generate_workout_plan(
            ai_engine.build_user_context(context_data), goals
        )
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI failed: {str(e)}")

    return result


def _gather_context(db: Session, today: date) -> dict:
    user = db.query(models.User).filter(models.User.id == 1).first()
    if not user:
        user = models.User(id=1)
        db.add(user)
        db.commit()
        db.refresh(user)

    sleep = db.query(models.SleepLog).filter(
        models.SleepLog.user_id == 1, models.SleepLog.date == today
    ).first()
    if not sleep:
        sleep = db.query(models.SleepLog).filter(
            models.SleepLog.user_id == 1,
            models.SleepLog.date == today - timedelta(days=1)
        ).first()

    recovery = db.query(models.RecoveryLog).filter(
        models.RecoveryLog.user_id == 1, models.RecoveryLog.date == today
    ).first()

    heart = db.query(models.HeartLog).filter(
        models.HeartLog.user_id == 1, models.HeartLog.date == today
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

    meals = db.query(models.NutritionLog).filter(
        models.NutritionLog.user_id == 1, models.NutritionLog.date == today
    ).all()
    water_ml = db.query(func.sum(models.WaterLog.amount_ml)).filter(
        models.WaterLog.user_id == 1, models.WaterLog.date == today
    ).scalar() or 0

    supps = db.query(models.SupplementLog).filter(
        models.SupplementLog.user_id == 1, models.SupplementLog.date == today
    ).all()

    cutoff = today - timedelta(days=7)
    workouts = db.query(models.WorkoutSession).filter(
        models.WorkoutSession.user_id == 1, models.WorkoutSession.date >= cutoff
    ).order_by(desc(models.WorkoutSession.date)).all()

    goals = db.query(models.Goal).filter(
        models.Goal.user_id == 1, models.Goal.is_active == True
    ).all()

    return {
        "today": str(today),
        "user": {
            "name": user.name, "age": user.age, "weight_kg": user.weight_kg,
            "height_cm": user.height_cm, "sex": user.sex, "chronotype": user.chronotype,
            "hrv_baseline": user.hrv_baseline, "resting_hr_baseline": user.resting_hr_baseline,
        },
        "sleep": {
            "total_duration_hours": sleep.total_duration_hours if sleep else None,
            "quality_score": sleep.quality_score if sleep else None,
            "deep_sleep_hours": sleep.deep_sleep_hours if sleep else None,
            "rem_sleep_hours": sleep.rem_sleep_hours if sleep else None,
            "hrv_morning": sleep.hrv_morning if sleep else None,
            "awakenings": sleep.awakenings if sleep else 0,
            "notes": sleep.notes if sleep else None,
        } if sleep else None,
        "recovery": {
            "muscle_soreness": recovery.muscle_soreness if recovery else None,
            "energy_level": recovery.energy_level if recovery else None,
            "stress_level": recovery.stress_level if recovery else None,
            "mood_score": recovery.mood_score if recovery else None,
            "motivation_score": recovery.motivation_score if recovery else None,
            "cognitive_clarity": recovery.cognitive_clarity if recovery else None,
            "injuries": recovery.injuries if recovery else None,
        } if recovery else None,
        "heart": {
            "resting_hr": heart.resting_hr if heart else None,
            "hrv": heart.hrv if heart else None,
            "spo2": heart.spo2 if heart else None,
            "vo2max": heart.vo2max if heart else None,
            "blood_pressure_systolic": heart.blood_pressure_systolic if heart else None,
            "blood_pressure_diastolic": heart.blood_pressure_diastolic if heart else None,
        } if heart else None,
        "nutrition_summary": {
            "total_calories": sum(m.calories for m in meals),
            "total_protein": sum(m.protein_g for m in meals),
            "total_carbs": sum(m.carbs_g for m in meals),
            "total_fat": sum(m.fat_g for m in meals),
            "total_fiber": sum(m.fiber_g for m in meals),
            "total_water_ml": float(water_ml),
        },
        "supplements": [{"supplement_name": s.supplement_name, "dosage": s.dosage, "unit": s.unit, "taken_at_hour": s.taken_at_hour} for s in supps],
        "stimulants": [{"stimulant_type": s.stimulant_type, "amount_mg": s.amount_mg, "taken_at_hour": s.taken_at_hour} for s in stimulants],
        "goals": [{"name": g.name, "category": g.category, "target_value": g.target_value, "current_value": g.current_value, "unit": g.unit} for g in goals],
        "recent_workouts": [{"date": str(w.date), "session_type": w.session_type, "duration_minutes": w.duration_minutes, "perceived_exertion": w.perceived_exertion, "volume_total": w.volume_total} for w in workouts],
        "peak_windows": peak_windows.model_dump(),
        "streaks": {},
    }
