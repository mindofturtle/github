from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/recovery", tags=["recovery"])


def _compute_score(log: models.RecoveryLog) -> float:
    factors = [
        (10 - (log.muscle_soreness or 5)),
        (log.energy_level or 5),
        (10 - (log.stress_level or 5)),
        (log.mood_score or 5),
        (log.motivation_score or 5),
        (log.cognitive_clarity or 5),
    ]
    return round(sum(factors) / (len(factors) * 10) * 100, 1)


@router.post("/", response_model=schemas.RecoveryLogResponse)
def log_recovery(data: schemas.RecoveryLogCreate, db: Session = Depends(get_db)):
    existing = db.query(models.RecoveryLog).filter(
        models.RecoveryLog.user_id == 1,
        models.RecoveryLog.date == data.date
    ).first()
    if existing:
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        r = schemas.RecoveryLogResponse.model_validate(existing)
        r.recovery_score = _compute_score(existing)
        return r

    entry = models.RecoveryLog(user_id=1, **data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    r = schemas.RecoveryLogResponse.model_validate(entry)
    r.recovery_score = _compute_score(entry)
    return r


@router.get("/today", response_model=Optional[schemas.RecoveryLogResponse])
def get_today(db: Session = Depends(get_db)):
    entry = db.query(models.RecoveryLog).filter(
        models.RecoveryLog.user_id == 1,
        models.RecoveryLog.date == date.today()
    ).first()
    if not entry:
        return None
    r = schemas.RecoveryLogResponse.model_validate(entry)
    r.recovery_score = _compute_score(entry)
    return r


@router.get("/", response_model=List[schemas.RecoveryLogResponse])
def list_recovery(days: int = 30, db: Session = Depends(get_db)):
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=days)
    entries = (
        db.query(models.RecoveryLog)
        .filter(models.RecoveryLog.user_id == 1, models.RecoveryLog.date >= cutoff)
        .order_by(desc(models.RecoveryLog.date))
        .all()
    )
    result = []
    for e in entries:
        r = schemas.RecoveryLogResponse.model_validate(e)
        r.recovery_score = _compute_score(e)
        result.append(r)
    return result
