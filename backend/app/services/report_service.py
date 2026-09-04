from __future__ import annotations

from datetime import date, datetime, time, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.food_entry import FoodEntry
from app.models.user import User
from app.schemas.report import ReportsOut, UserAverage, WeekComparison


def _window(today: date, days: int, offset_days: int = 0) -> tuple[date, date]:
    """Returns (start, end) inclusive date window of `days` days, ending
    `offset_days` days before today. offset_days=0 -> window ends today.
    """
    end = today - timedelta(days=offset_days)
    start = end - timedelta(days=days - 1)
    return start, end


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


def build_reports(db: Session, today: date | None = None) -> ReportsOut:
    today = today or date.today()

    # last 7 days = today and the 6 days before
    last_start, last_end = _window(today, 7, offset_days=0)
    # previous 7 days = the 7 days before that window
    prev_end = last_start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=6)

    last_count = _count_in_window(db, last_start, last_end)
    prev_count = _count_in_window(db, prev_start, prev_end)

    week_comparison = WeekComparison(
        last_7_days_count=last_count,
        previous_7_days_count=prev_count,
        last_7_days_from=last_start.isoformat(),
        last_7_days_to=last_end.isoformat(),
        previous_7_days_from=prev_start.isoformat(),
        previous_7_days_to=prev_end.isoformat(),
    )

    users = db.query(User).order_by(User.name).all()
    per_user_averages: list[UserAverage] = []
    total_calories = 0
    total_days_with_data = 0
    for u in users:
        total_cal = _sum_calories_in_window(db, last_start, last_end, user_id=u.id)
        entries_count = _count_in_window(db, last_start, last_end, user_id=u.id)
        avg = round(total_cal / 7, 1)
        per_user_averages.append(
            UserAverage(user_id=u.id, name=u.name, entries_count=entries_count, average_daily_calories=avg)
        )
        if entries_count > 0:
            total_calories += total_cal
            total_days_with_data += 7

    overall_avg = round(total_calories / total_days_with_data, 1) if total_days_with_data else 0.0

    return ReportsOut(
        week_comparison=week_comparison,
        per_user_averages=per_user_averages,
        overall_average_daily_calories=overall_avg,
    )
