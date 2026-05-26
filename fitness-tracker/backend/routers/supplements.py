from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import date
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/supplements", tags=["supplements"])


@router.post("/", response_model=schemas.SupplementLogResponse)
def log_supplement(data: schemas.SupplementLogCreate, db: Session = Depends(get_db)):
    entry = models.SupplementLog(user_id=1, **data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/today", response_model=List[schemas.SupplementLogResponse])
def get_today(db: Session = Depends(get_db)):
    return db.query(models.SupplementLog).filter(
        models.SupplementLog.user_id == 1,
        models.SupplementLog.date == date.today()
    ).order_by(models.SupplementLog.taken_at_hour).all()


@router.get("/", response_model=List[schemas.SupplementLogResponse])
def list_supplements(days: int = 30, db: Session = Depends(get_db)):
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=days)
    return (
        db.query(models.SupplementLog)
        .filter(models.SupplementLog.user_id == 1, models.SupplementLog.date >= cutoff)
        .order_by(desc(models.SupplementLog.date))
        .all()
    )


@router.delete("/{log_id}")
def delete_supplement(log_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.SupplementLog).filter(models.SupplementLog.id == log_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}


@router.post("/stimulants", response_model=schemas.StimulantLogResponse)
def log_stimulant(data: schemas.StimulantLogCreate, db: Session = Depends(get_db)):
    entry = models.StimulantLog(user_id=1, **data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/stimulants/today", response_model=List[schemas.StimulantLogResponse])
def get_today_stimulants(db: Session = Depends(get_db)):
    return db.query(models.StimulantLog).filter(
        models.StimulantLog.user_id == 1,
        models.StimulantLog.date == date.today()
    ).order_by(models.StimulantLog.taken_at_hour).all()


@router.get("/stimulants", response_model=List[schemas.StimulantLogResponse])
def list_stimulants(days: int = 30, db: Session = Depends(get_db)):
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=days)
    return (
        db.query(models.StimulantLog)
        .filter(models.StimulantLog.user_id == 1, models.StimulantLog.date >= cutoff)
        .order_by(desc(models.StimulantLog.date))
        .all()
    )


@router.delete("/stimulants/{log_id}")
def delete_stimulant(log_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.StimulantLog).filter(models.StimulantLog.id == log_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}
