from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date
from typing import List, Optional
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/sleep", tags=["sleep"])


@router.post("/", response_model=schemas.SleepLogResponse)
def log_sleep(data: schemas.SleepLogCreate, db: Session = Depends(get_db)):
    existing = db.query(models.SleepLog).filter(
        models.SleepLog.user_id == 1,
        models.SleepLog.date == data.date
    ).first()
    if existing:
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing

    entry = models.SleepLog(user_id=1, **data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/today", response_model=Optional[schemas.SleepLogResponse])
def get_today_sleep(db: Session = Depends(get_db)):
    return db.query(models.SleepLog).filter(
        models.SleepLog.user_id == 1,
        models.SleepLog.date == date.today()
    ).first()


@router.get("/", response_model=List[schemas.SleepLogResponse])
def get_sleep_history(limit: int = 30, db: Session = Depends(get_db)):
    return (
        db.query(models.SleepLog)
        .filter(models.SleepLog.user_id == 1)
        .order_by(desc(models.SleepLog.date))
        .limit(limit)
        .all()
    )


@router.delete("/{log_id}")
def delete_sleep(log_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.SleepLog).filter(models.SleepLog.id == log_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}
