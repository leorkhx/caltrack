from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.food_entry import FoodEntry
from app.models.user import User
from app.schemas.food_entry import AdminFoodEntryCreate, FoodEntryCreate, FoodEntryUpdate


def _date_bounds(date_from: Optional[date], date_to: Optional[date]):
    start = datetime.combine(date_from, time.min) if date_from else None
    end = datetime.combine(date_to, time.max) if date_to else None
    return start, end


def list_entries_for_user(
    db: Session, user_id: int, date_from: Optional[date] = None, date_to: Optional[date] = None
) -> list[FoodEntry]:
    query = db.query(FoodEntry).filter(FoodEntry.user_id == user_id)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(FoodEntry.consumed_at >= start)
    if end:
        query = query.filter(FoodEntry.consumed_at <= end)
    return query.order_by(FoodEntry.consumed_at.desc()).all()


def list_entries_admin(
    db: Session,
    user_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    page_size: int = 20,
):
    query = db.query(FoodEntry)
    if user_id is not None:
        query = query.filter(FoodEntry.user_id == user_id)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(FoodEntry.consumed_at >= start)
    if end:
        query = query.filter(FoodEntry.consumed_at <= end)
    total = query.count()
    items = (
        query.order_by(FoodEntry.consumed_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def create_entry_for_self(db: Session, user: User, payload: FoodEntryCreate) -> FoodEntry:
    entry = FoodEntry(user_id=user.id, **payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def create_entry_admin(db: Session, payload: AdminFoodEntryCreate) -> FoodEntry:
    target = db.query(User).filter(User.id == payload.user_id).first()
    if target is None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="user_id does not exist.")
    entry = FoodEntry(**payload.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_entry_or_404(db: Session, entry_id: int, user: User, is_admin: bool) -> FoodEntry:
    entry = db.query(FoodEntry).filter(FoodEntry.id == entry_id).first()
    if entry is None or (not is_admin and entry.user_id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Food entry not found.")
    return entry


def update_entry(db: Session, entry: FoodEntry, payload: FoodEntryUpdate, is_admin: bool) -> FoodEntry:
    data = payload.model_dump(exclude_unset=True)
    if not is_admin:
        data.pop("user_id", None)
    elif "user_id" in data and data["user_id"] is not None:
        target = db.query(User).filter(User.id == data["user_id"]).first()
        if target is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="user_id does not exist.")
    for field, value in data.items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


def delete_entry(db: Session, entry: FoodEntry) -> None:
    db.delete(entry)
    db.commit()
