from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/heart", tags=["heart"])


@router.post("/", response_model=schemas.HeartLogResponse)
def log_heart(data: schemas.HeartLogCreate, db: Session = Depends(get_db)):
    existing = db.query(models.HeartLog).filter(
        models.HeartLog.user_id == 1,
        models.HeartLog.date == data.date
    ).first()
    if existing:
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    entry = models.HeartLog(user_id=1, **data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/today", response_model=Optional[schemas.HeartLogResponse])
def get_today(db: Session = Depends(get_db)):
    return db.query(models.HeartLog).filter(
        models.HeartLog.user_id == 1,
        models.HeartLog.date == date.today()
    ).first()


@router.get("/", response_model=List[schemas.HeartLogResponse])
def list_heart(days: int = 30, db: Session = Depends(get_db)):
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=days)
    return (
        db.query(models.HeartLog)
        .filter(models.HeartLog.user_id == 1, models.HeartLog.date >= cutoff)
        .order_by(desc(models.HeartLog.date))
        .all()
    )


@router.delete("/{log_id}")
def delete_heart(log_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.HeartLog).filter(models.HeartLog.id == log_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}
