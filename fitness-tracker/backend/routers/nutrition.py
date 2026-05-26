from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import date
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])


@router.post("/", response_model=schemas.NutritionLogResponse)
def log_meal(data: schemas.NutritionLogCreate, db: Session = Depends(get_db)):
    entry = models.NutritionLog(user_id=1, **data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/today", response_model=List[schemas.NutritionLogResponse])
def get_today_meals(db: Session = Depends(get_db)):
    return db.query(models.NutritionLog).filter(
        models.NutritionLog.user_id == 1,
        models.NutritionLog.date == date.today()
    ).order_by(models.NutritionLog.logged_at_hour).all()


@router.get("/summary/{log_date}", response_model=schemas.NutritionSummary)
def get_daily_summary(log_date: date, db: Session = Depends(get_db)):
    meals = db.query(models.NutritionLog).filter(
        models.NutritionLog.user_id == 1,
        models.NutritionLog.date == log_date
    ).all()
    water = db.query(func.sum(models.WaterLog.amount_ml)).filter(
        models.WaterLog.user_id == 1,
        models.WaterLog.date == log_date
    ).scalar() or 0

    return schemas.NutritionSummary(
        date=log_date,
        total_calories=sum(m.calories for m in meals),
        total_protein=sum(m.protein_g for m in meals),
        total_carbs=sum(m.carbs_g for m in meals),
        total_fat=sum(m.fat_g for m in meals),
        total_fiber=sum(m.fiber_g for m in meals),
        total_water_ml=float(water),
        meal_count=len(meals),
    )


@router.get("/history", response_model=List[schemas.NutritionLogResponse])
def get_history(days: int = 30, db: Session = Depends(get_db)):
    from datetime import timedelta
    cutoff = date.today() - timedelta(days=days)
    return (
        db.query(models.NutritionLog)
        .filter(models.NutritionLog.user_id == 1, models.NutritionLog.date >= cutoff)
        .order_by(desc(models.NutritionLog.date))
        .all()
    )


@router.delete("/{log_id}")
def delete_meal(log_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    entry = db.query(models.NutritionLog).filter(models.NutritionLog.id == log_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry)
    db.commit()
    return {"ok": True}


@router.post("/water", response_model=schemas.WaterLogResponse)
def log_water(data: schemas.WaterLogCreate, db: Session = Depends(get_db)):
    entry = models.WaterLog(user_id=1, **data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/water/today")
def get_today_water(db: Session = Depends(get_db)):
    total = db.query(func.sum(models.WaterLog.amount_ml)).filter(
        models.WaterLog.user_id == 1,
        models.WaterLog.date == date.today()
    ).scalar() or 0
    return {"total_ml": float(total), "total_liters": round(float(total) / 1000, 2)}
