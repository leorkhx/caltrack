from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import require_admin
from app.models.food_entry import FoodEntry
from app.models.user import User
from app.schemas.food_entry import (
    AdminDayStatsOut,
    AdminFoodEntryCreate,
    AdminFoodEntryOut,
    FoodEntryUpdate,
    PaginatedAdminFoodEntries,
)
from app.schemas.user import UserOut
from app.services import food_entry_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _to_admin_out(entry: FoodEntry, day_total: int) -> AdminFoodEntryOut:
    return AdminFoodEntryOut(
        id=entry.id,
        user_id=entry.user_id,
        food_name=entry.food_name,
        calories=entry.calories,
        quantity=entry.quantity,
        unit=entry.unit,
        meal_type=entry.meal_type,
        protein_g=entry.protein_g,
        carbs_g=entry.carbs_g,
        fat_g=entry.fat_g,
        consumed_at=entry.consumed_at,
        from_fdc=entry.from_fdc,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
        user_name=entry.user.name,
        user_daily_limit=entry.user.daily_calorie_limit,
        day_total=day_total,
    )


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    return db.query(User).order_by(User.name).all()


@router.get("/food-entries", response_model=PaginatedAdminFoodEntries)
def list_all_entries(
    user_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    cursor: Optional[str] = None,
    page_size: int = Query(20, ge=1, le=200),
    search: Optional[str] = None,
    sort: str = "date_desc",
    day_status: Optional[str] = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    items, total, next_cursor = food_entry_service.list_entries_admin(
        db, user_id, date_from, date_to, cursor, page_size, search, sort, day_status
    )
    day_totals = food_entry_service.day_totals_for(db, items)
    return PaginatedAdminFoodEntries(
        items=[_to_admin_out(e, day_totals.get((e.user_id, e.consumed_at.date()), e.calories)) for e in items],
        total=total,
        page_size=page_size,
        next_cursor=next_cursor,
    )


@router.get("/food-entries/stats", response_model=AdminDayStatsOut)
def get_entries_stats(
    user_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    tz_offset_minutes: int = Query(0, ge=-840, le=840),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    stats = food_entry_service.get_admin_day_stats(db, user_id, date_from, date_to, tz_offset_minutes)
    return AdminDayStatsOut(
        avg_per_logged_day=stats["avg_per_logged_day"],
        days_over_limit=stats["days_over_limit"],
        active_users=stats["active_users"],
        since=str(stats["since"]) if stats["since"] else None,
    )


@router.get("/food-entries/total-calories")
def get_total_calories(
    user_id: int,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return {"total_calories": food_entry_service.get_total_calories(db, user_id, date_from, date_to)}


@router.post("/food-entries", response_model=AdminFoodEntryOut, status_code=201)
def create_entry(
    payload: AdminFoodEntryCreate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    entry = food_entry_service.create_entry_admin(db, payload)
    day_total = food_entry_service.day_totals_for(db, [entry]).get((entry.user_id, entry.consumed_at.date()), entry.calories)
    return _to_admin_out(entry, day_total)


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
    day_total = food_entry_service.day_totals_for(db, [entry]).get((entry.user_id, entry.consumed_at.date()), entry.calories)
    return _to_admin_out(entry, day_total)


@router.delete("/food-entries/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    entry = food_entry_service.get_entry_or_404(db, entry_id, admin, is_admin=True)
    food_entry_service.delete_entry(db, entry)
    return None
