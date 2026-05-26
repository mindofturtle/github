from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func
from datetime import date, timedelta
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/workouts", tags=["workouts"])


@router.get("/exercises", response_model=List[schemas.ExerciseResponse])
def list_exercises(db: Session = Depends(get_db)):
    return db.query(models.Exercise).order_by(models.Exercise.name).all()


@router.post("/exercises", response_model=schemas.ExerciseResponse)
def create_exercise(data: schemas.ExerciseCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Exercise).filter(
        func.lower(models.Exercise.name) == data.name.lower()
    ).first()
    if existing:
        return existing
    ex = models.Exercise(**data.model_dump())
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return ex


@router.post("/sessions", response_model=schemas.WorkoutSessionResponse)
def log_session(data: schemas.WorkoutSessionCreate, db: Session = Depends(get_db)):
    sets_data = data.sets
    session_data = data.model_dump(exclude={"sets"})
    session = models.WorkoutSession(user_id=1, **session_data)
    db.add(session)
    db.flush()

    total_volume = 0.0
    for s in sets_data:
        es = models.ExerciseSet(session_id=session.id, **s.model_dump())
        total_volume += (s.weight_kg or 0) * (s.reps or 1)
        db.add(es)

    session.volume_total = total_volume
    db.commit()
    db.refresh(session)
    return _enrich_session(session, db)


@router.get("/sessions", response_model=List[schemas.WorkoutSessionResponse])
def list_sessions(days: int = 30, db: Session = Depends(get_db)):
    cutoff = date.today() - timedelta(days=days)
    sessions = (
        db.query(models.WorkoutSession)
        .filter(models.WorkoutSession.user_id == 1, models.WorkoutSession.date >= cutoff)
        .order_by(desc(models.WorkoutSession.date))
        .all()
    )
    return [_enrich_session(s, db) for s in sessions]


@router.get("/sessions/{session_id}", response_model=schemas.WorkoutSessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(models.WorkoutSession).filter(models.WorkoutSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    return _enrich_session(s, db)


@router.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(models.WorkoutSession).filter(models.WorkoutSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(s)
    db.commit()
    return {"ok": True}


@router.get("/progressive-overload/{exercise_id}")
def get_overload_history(exercise_id: int, db: Session = Depends(get_db)):
    sets = (
        db.query(models.ExerciseSet, models.WorkoutSession.date)
        .join(models.WorkoutSession, models.ExerciseSet.session_id == models.WorkoutSession.id)
        .filter(models.ExerciseSet.exercise_id == exercise_id)
        .order_by(models.WorkoutSession.date)
        .all()
    )
    result = []
    for es, d in sets:
        result.append({
            "date": str(d),
            "set_number": es.set_number,
            "weight_kg": es.weight_kg,
            "reps": es.reps,
            "volume": (es.weight_kg or 0) * (es.reps or 1),
            "rpe": es.rpe,
            "is_pr": es.is_pr,
        })
    return result


def _enrich_session(session: models.WorkoutSession, db: Session) -> schemas.WorkoutSessionResponse:
    sets = db.query(models.ExerciseSet).filter(
        models.ExerciseSet.session_id == session.id
    ).all()
    enriched_sets = []
    for s in sets:
        ex = db.query(models.Exercise).filter(models.Exercise.id == s.exercise_id).first()
        enriched_sets.append(schemas.ExerciseSetResponse(
            id=s.id,
            session_id=s.session_id,
            exercise_id=s.exercise_id,
            set_number=s.set_number,
            weight_kg=s.weight_kg,
            reps=s.reps,
            duration_seconds=s.duration_seconds,
            rpe=s.rpe,
            is_pr=s.is_pr,
            exercise_name=ex.name if ex else None,
        ))
    return schemas.WorkoutSessionResponse(
        id=session.id,
        user_id=session.user_id,
        date=session.date,
        session_type=session.session_type,
        duration_minutes=session.duration_minutes,
        intensity_score=session.intensity_score,
        perceived_exertion=session.perceived_exertion,
        volume_total=session.volume_total,
        notes=session.notes,
        created_at=session.created_at,
        exercise_sets=enriched_sets,
    )
