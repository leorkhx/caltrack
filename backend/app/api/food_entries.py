from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.food_entry import FoodEntryCount, FoodEntryCreate, FoodEntryOut, FoodEntryUpdate
from app.services import food_entry_service

router = APIRouter(prefix="/api/food-entries", tags=["food-entries"])


@router.get("", response_model=list[FoodEntryOut])
def list_my_entries(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return food_entry_service.list_entries_for_user(db, current_user.id, date_from, date_to)


@router.get("/count", response_model=FoodEntryCount)
def count_my_entries(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    total = food_entry_service.count_entries_for_user(db, current_user.id, date_from, date_to)
    return FoodEntryCount(total=total)


@router.post("", response_model=FoodEntryOut, status_code=201)
def create_my_entry(
    payload: FoodEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return food_entry_service.create_entry_for_self(db, current_user, payload)


@router.put("/{entry_id}", response_model=FoodEntryOut)
@router.patch("/{entry_id}", response_model=FoodEntryOut)
def update_my_entry(
    entry_id: int,
    payload: FoodEntryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_admin = current_user.role == UserRole.admin
    entry = food_entry_service.get_entry_or_404(db, entry_id, current_user, is_admin)
    return food_entry_service.update_entry(db, entry, payload, is_admin)


@router.delete("/{entry_id}", status_code=204)
def delete_my_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    is_admin = current_user.role == UserRole.admin
    entry = food_entry_service.get_entry_or_404(db, entry_id, current_user, is_admin)
    food_entry_service.delete_entry(db, entry)
    return None
