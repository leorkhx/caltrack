from __future__ import annotations

from datetime import date, datetime, time, timedelta
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.food_entry import FoodEntry
from app.models.user import User, UserRole
from app.schemas.report import DailyTotal, PeriodComparison, ReportsOut, UserAverage
from app.schemas.top_food import TopFood, TopFoodsOut


def _count_in_window(db: Session, start: date, end: date, user_id: int | None = None) -> int:
    q = db.query(func.count(FoodEntry.id)).filter(
        FoodEntry.consumed_at >= datetime.combine(start, time.min),
        FoodEntry.consumed_at <= datetime.combine(end, time.max),
    )
    if user_id is not None:
        q = q.filter(FoodEntry.user_id == user_id)
    return q.scalar() or 0


def _sum_calories_in_window(db: Session, start: date, end: date, user_id: int | None = None) -> int:
    q = db.query(func.coalesce(func.sum(FoodEntry.calories), 0)).filter(
        FoodEntry.consumed_at >= datetime.combine(start, time.min),
        FoodEntry.consumed_at <= datetime.combine(end, time.max),
    )
    if user_id is not None:
        q = q.filter(FoodEntry.user_id == user_id)
    return q.scalar() or 0


def _earliest_entry_date(db: Session) -> date:
    earliest = db.query(func.min(FoodEntry.consumed_at)).scalar()
    return earliest.date() if earliest else date.today()


def build_reports(
    db: Session, today: date | None = None, days: Optional[int] = 7, user_id: Optional[int] = None
) -> ReportsOut:
    today = today or date.today()

    if days is None:
        start = _earliest_entry_date(db)
        end = today
    else:
        end = today
        start = end - timedelta(days=days - 1)
    span = (end - start).days + 1

    prev_end = start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=span - 1)

    current_count = _count_in_window(db, start, end, user_id=user_id)
    previous_count = _count_in_window(db, prev_start, prev_end, user_id=user_id)

    period_comparison = PeriodComparison(
        current_count=current_count,
        previous_count=previous_count,
        current_from=start.isoformat(),
        current_to=end.isoformat(),
        previous_from=prev_start.isoformat(),
        previous_to=prev_end.isoformat(),
    )

    # Only regular users show up in per-user stats — the admin account doesn't log food.
    users_query = db.query(User).filter(User.role == UserRole.user)
    if user_id is not None:
        users_query = users_query.filter(User.id == user_id)
    users = users_query.order_by(User.name).all()

    per_user_averages: list[UserAverage] = []
    total_calories = 0
    total_days_with_data = 0
    for u in users:
        total_cal = _sum_calories_in_window(db, start, end, user_id=u.id)
        entries_count = _count_in_window(db, start, end, user_id=u.id)
        avg = round(total_cal / span, 1) if span else 0.0
        per_user_averages.append(
            UserAverage(user_id=u.id, name=u.name, entries_count=entries_count, average_daily_calories=avg)
        )
        if entries_count > 0:
            total_calories += total_cal
            total_days_with_data += span

    overall_avg = round(total_calories / total_days_with_data, 1) if total_days_with_data else 0.0

    daily_query = (
        db.query(
            func.date(FoodEntry.consumed_at).label("day"),
            func.coalesce(func.sum(FoodEntry.calories), 0).label("total_calories"),
            func.count(FoodEntry.id).label("entries_count"),
        )
        .join(User, User.id == FoodEntry.user_id)
        .filter(
            User.role == UserRole.user,
            FoodEntry.consumed_at >= datetime.combine(start, time.min),
            FoodEntry.consumed_at <= datetime.combine(end, time.max),
        )
    )
    if user_id is not None:
        daily_query = daily_query.filter(FoodEntry.user_id == user_id)
    daily_rows = daily_query.group_by(func.date(FoodEntry.consumed_at)).all()
    # `func.date(...)` can come back as a string or a native date object
    # depending on the DB driver — normalize to an ISO string for a reliable lookup below.
    totals_by_day = {
        (row.day if isinstance(row.day, str) else row.day.isoformat()): (row.total_calories, row.entries_count)
        for row in daily_rows
    }
    daily_totals: list[DailyTotal] = []
    cursor = start
    while cursor <= end:
        key = cursor.isoformat()
        cal, cnt = totals_by_day.get(key, (0, 0))
        daily_totals.append(DailyTotal(date=key, total_calories=cal, entries_count=cnt))
        cursor += timedelta(days=1)

    return ReportsOut(
        period_days=days,
        period_comparison=period_comparison,
        per_user_averages=per_user_averages,
        overall_average_daily_calories=overall_avg,
        daily_totals=daily_totals,
    )


def build_top_foods(
    db: Session,
    today: date | None = None,
    days: Optional[int] = None,
    page: int = 1,
    page_size: int = 20,
) -> TopFoodsOut:
    today = today or date.today()

    if days is None:
        start = _earliest_entry_date(db)
        end = today
    else:
        end = today
        start = end - timedelta(days=days - 1)

    name_key = func.lower(func.trim(FoodEntry.food_name))
    base_query = (
        db.query(
            name_key.label("key"),
            func.min(FoodEntry.food_name).label("food_name"),
            func.count(FoodEntry.id).label("entries_count"),
            func.coalesce(func.sum(FoodEntry.calories), 0).label("total_calories"),
        )
        .join(User, User.id == FoodEntry.user_id)
        .filter(
            User.role == UserRole.user,
            FoodEntry.consumed_at >= datetime.combine(start, time.min),
            FoodEntry.consumed_at <= datetime.combine(end, time.max),
        )
        .group_by(name_key)
    )

    total = base_query.count()

    rows = (
        base_query.order_by(func.count(FoodEntry.id).desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        TopFood(
            food_name=row.food_name,
            entries_count=row.entries_count,
            total_calories=row.total_calories,
            average_calories=round(row.total_calories / row.entries_count, 1) if row.entries_count else 0.0,
        )
        for row in rows
    ]

    return TopFoodsOut(period_days=days, items=items, total=total, page=page, page_size=page_size)
