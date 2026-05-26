from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/users", tags=["users"])


def get_or_create_user(db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.id == 1).first()
    if not user:
        user = models.User(id=1)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/me", response_model=schemas.UserResponse)
def get_user(db: Session = Depends(get_db)):
    return get_or_create_user(db)


@router.put("/me", response_model=schemas.UserResponse)
def update_user(data: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user
