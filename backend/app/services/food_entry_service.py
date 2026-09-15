from datetime import date, datetime, time, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.food_entry import FoodEntry
from app.models.user import User
from app.schemas.food_entry import AdminFoodEntryCreate, FoodEntryCreate, FoodEntryUpdate


MAX_ENTRIES_PER_REQUEST = 2000


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
    # Hard cap so a long-lived account with no date filter can't pull its
    # entire history into memory in one request.
    return query.order_by(FoodEntry.consumed_at.desc()).limit(MAX_ENTRIES_PER_REQUEST).all()


def count_entries_for_user(
    db: Session, user_id: int, date_from: Optional[date] = None, date_to: Optional[date] = None
) -> int:
    query = db.query(func.count(FoodEntry.id)).filter(FoodEntry.user_id == user_id)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(FoodEntry.consumed_at >= start)
    if end:
        query = query.filter(FoodEntry.consumed_at <= end)
    return query.scalar() or 0


def day_totals_for(db: Session, items: list[FoodEntry]) -> dict[tuple[int, date], int]:
    """Sum of calories per (user_id, day) for just the users/date-range covered
    by `items` — avoids pulling every entry in the table to compute totals for
    one page's worth of rows."""
    if not items:
        return {}
    user_ids = {e.user_id for e in items}
    dates = [e.consumed_at.date() for e in items]
    start = datetime.combine(min(dates), time.min)
    end = datetime.combine(max(dates), time.max)
    rows = (
        db.query(FoodEntry.user_id, FoodEntry.consumed_at, FoodEntry.calories)
        .filter(FoodEntry.user_id.in_(user_ids))
        .filter(FoodEntry.consumed_at >= start)
        .filter(FoodEntry.consumed_at <= end)
        .all()
    )
    totals: dict[tuple[int, date], int] = {}
    for user_id, consumed_at, calories in rows:
        key = (user_id, consumed_at.date())
        totals[key] = totals.get(key, 0) + calories
    return totals


# Each sort mode pairs a primary column with `id` as a tiebreaker, so a
# cursor (last-seen primary value + id) uniquely identifies "where to
# continue from" with no offset/page-number involved.
_SORT_SPECS = {
    "date_desc": (FoodEntry.consumed_at, "desc", lambda e: e.consumed_at.isoformat()),
    "date_asc": (FoodEntry.consumed_at, "asc", lambda e: e.consumed_at.isoformat()),
    "calories_desc": (FoodEntry.calories, "desc", lambda e: e.calories),
    "calories_asc": (FoodEntry.calories, "asc", lambda e: e.calories),
}


def encode_cursor(entry: FoodEntry, sort: str) -> str:
    _, _, value_fn = _SORT_SPECS.get(sort, _SORT_SPECS["date_desc"])
    return f"{value_fn(entry)}|{entry.id}"


def _decode_cursor(cursor: str, sort: str):
    value_str, id_str = cursor.rsplit("|", 1)
    if sort.startswith("calories"):
        return int(value_str), int(id_str)
    return datetime.fromisoformat(value_str), int(id_str)


def list_entries_admin(
    db: Session,
    user_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    cursor: Optional[str] = None,
    page_size: int = 20,
    search: Optional[str] = None,
    sort: str = "date_desc",
    day_status: Optional[str] = None,
):
    query = db.query(FoodEntry).options(joinedload(FoodEntry.user))
    if user_id is not None:
        query = query.filter(FoodEntry.user_id == user_id)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(FoodEntry.consumed_at >= start)
    if end:
        query = query.filter(FoodEntry.consumed_at <= end)
    if search:
        query = query.filter(FoodEntry.food_name.ilike(f"%{search}%"))

    if day_status in ("over", "within"):
        day_col = func.date(FoodEntry.consumed_at)
        day_totals_subq = (
            db.query(
                FoodEntry.user_id.label("user_id"),
                day_col.label("day"),
                func.sum(FoodEntry.calories).label("day_total"),
            )
            .group_by(FoodEntry.user_id, day_col)
            .subquery()
        )
        query = (
            query.join(User, User.id == FoodEntry.user_id)
            .join(
                day_totals_subq,
                (day_totals_subq.c.user_id == FoodEntry.user_id)
                & (day_totals_subq.c.day == day_col),
            )
        )
        if day_status == "over":
            query = query.filter(day_totals_subq.c.day_total > User.daily_calorie_limit)
        else:
            query = query.filter(day_totals_subq.c.day_total <= User.daily_calorie_limit)

    total = query.count()

    primary_col, direction, _ = _SORT_SPECS.get(sort, _SORT_SPECS["date_desc"])
    if cursor:
        last_value, last_id = _decode_cursor(cursor, sort)
        if direction == "desc":
            query = query.filter(
                (primary_col < last_value) | ((primary_col == last_value) & (FoodEntry.id < last_id))
            )
        else:
            query = query.filter(
                (primary_col > last_value) | ((primary_col == last_value) & (FoodEntry.id > last_id))
            )

    order = (primary_col.desc(), FoodEntry.id.desc()) if direction == "desc" else (primary_col.asc(), FoodEntry.id.asc())
    items = query.order_by(*order).limit(page_size).all()
    next_cursor = encode_cursor(items[-1], sort) if len(items) == page_size else None
    return items, total, next_cursor


def get_admin_day_stats(
    db: Session,
    user_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    """Per-(user, day) calorie totals computed by the DB via GROUP BY, so this
    scales to any table size instead of summing rows fetched into memory."""
    day_col = func.date(FoodEntry.consumed_at)
    query = (
        db.query(
            FoodEntry.user_id,
            day_col.label("day"),
            func.sum(FoodEntry.calories).label("total"),
            User.daily_calorie_limit,
        )
        .join(User, User.id == FoodEntry.user_id)
    )
    if user_id is not None:
        query = query.filter(FoodEntry.user_id == user_id)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(FoodEntry.consumed_at >= start)
    if end:
        query = query.filter(FoodEntry.consumed_at <= end)
    rows = query.group_by(FoodEntry.user_id, day_col, User.daily_calorie_limit).all()

    if not rows:
        return {"avg_per_logged_day": 0, "days_over_limit": 0, "active_users": 0, "since": None}

    totals = [r.total for r in rows]
    days_over_limit = sum(1 for r in rows if r.total > r.daily_calorie_limit)
    active_users = len({r.user_id for r in rows})
    since = min(r.day for r in rows)
    return {
        "avg_per_logged_day": round(sum(totals) / len(totals)),
        "days_over_limit": days_over_limit,
        "active_users": active_users,
        "since": since,
    }


def get_total_calories(
    db: Session, user_id: int, date_from: Optional[date] = None, date_to: Optional[date] = None
) -> int:
    """Plain SUM(calories) over the range — a true period average divides this
    by the number of days in the range, including days with no entries."""
    query = db.query(func.sum(FoodEntry.calories)).filter(FoodEntry.user_id == user_id)
    start, end = _date_bounds(date_from, date_to)
    if start:
        query = query.filter(FoodEntry.consumed_at >= start)
    if end:
        query = query.filter(FoodEntry.consumed_at <= end)
    return query.scalar() or 0


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
