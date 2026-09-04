from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.food_entry import FoodEntry
from app.models.user import User
from app.schemas.food_entry import (
    AdminFoodEntryCreate,
    AdminFoodEntryOut,
    FoodEntryUpdate,
    PaginatedAdminFoodEntries,
)
from app.schemas.user import UserOut
from app.services import food_entry_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _to_admin_out(entry: FoodEntry) -> AdminFoodEntryOut:
    return AdminFoodEntryOut(
        id=entry.id,
        user_id=entry.user_id,
        food_name=entry.food_name,
        calories=entry.calories,
        consumed_at=entry.consumed_at,
        from_fdc=entry.from_fdc,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        user_name=entry.user.name,
        user_daily_limit=entry.user.daily_calorie_limit,
    )


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(User).order_by(User.name).all()


@router.get("/food-entries", response_model=PaginatedAdminFoodEntries)
def list_all_entries(
    user_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    items, total = food_entry_service.list_entries_admin(db, user_id, date_from, date_to, page, page_size)
    return PaginatedAdminFoodEntries(
        items=[_to_admin_out(e) for e in items], total=total, page=page, page_size=page_size
    )


@router.post("/food-entries", response_model=AdminFoodEntryOut, status_code=201)
def create_entry(
    payload: AdminFoodEntryCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    entry = food_entry_service.create_entry_admin(db, payload)
    return _to_admin_out(entry)


@router.put("/food-entries/{entry_id}", response_model=AdminFoodEntryOut)
@router.patch("/food-entries/{entry_id}", response_model=AdminFoodEntryOut)
def update_entry(
    entry_id: int,
    payload: FoodEntryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    entry = food_entry_service.get_entry_or_404(db, entry_id, admin, is_admin=True)
    entry = food_entry_service.update_entry(db, entry, payload, is_admin=True)
    return _to_admin_out(entry)


@router.delete("/food-entries/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    entry = food_entry_service.get_entry_or_404(db, entry_id, admin, is_admin=True)
    food_entry_service.delete_entry(db, entry)
    return None
