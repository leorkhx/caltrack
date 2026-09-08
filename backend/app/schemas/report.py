from typing import Optional

from pydantic import BaseModel


class PeriodComparison(BaseModel):
    current_count: int
    previous_count: int
    current_from: str
    current_to: str
    previous_from: str
    previous_to: str


class UserAverage(BaseModel):
    user_id: int
    name: str
    entries_count: int
    average_daily_calories: float


class DailyTotal(BaseModel):
    date: str
    total_calories: int
    entries_count: int


class ReportsOut(BaseModel):
    period_days: Optional[int]  # None means all-time
    period_comparison: PeriodComparison
    per_user_averages: list[UserAverage]
    overall_average_daily_calories: float
    daily_totals: list[DailyTotal]
