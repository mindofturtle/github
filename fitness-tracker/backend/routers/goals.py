from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/goals", tags=["goals"])


@router.post("/", response_model=schemas.GoalResponse)
def create_goal(data: schemas.GoalCreate, db: Session = Depends(get_db)):
    goal = models.Goal(user_id=1, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return _enrich(goal)


@router.get("/", response_model=List[schemas.GoalResponse])
def list_goals(active_only: bool = True, db: Session = Depends(get_db)):
    q = db.query(models.Goal).filter(models.Goal.user_id == 1)
    if active_only:
        q = q.filter(models.Goal.is_active == True)
    goals = q.order_by(models.Goal.priority, desc(models.Goal.created_at)).all()
    return [_enrich(g) for g in goals]


@router.put("/{goal_id}", response_model=schemas.GoalResponse)
def update_goal(goal_id: int, data: schemas.GoalUpdate, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(goal, k, v)
    db.commit()
    db.refresh(goal)
    return _enrich(goal)


@router.delete("/{goal_id}")
def delete_goal(goal_id: int, db: Session = Depends(get_db)):
    goal = db.query(models.Goal).filter(models.Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(goal)
    db.commit()
    return {"ok": True}


def _enrich(goal: models.Goal) -> schemas.GoalResponse:
    pct = None
    if goal.target_value and goal.current_value is not None and goal.target_value > 0:
        pct = round((goal.current_value / goal.target_value) * 100, 1)
    return schemas.GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        category=goal.category,
        target_value=goal.target_value,
        current_value=goal.current_value,
        unit=goal.unit,
        deadline=goal.deadline,
        priority=goal.priority,
        notes=goal.notes,
        is_active=goal.is_active,
        progress_pct=pct,
        created_at=goal.created_at,
    )
