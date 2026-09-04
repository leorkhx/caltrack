from pydantic import BaseModel


class WeekComparison(BaseModel):
    last_7_days_count: int
    previous_7_days_count: int
    last_7_days_from: str
    last_7_days_to: str
    previous_7_days_from: str
    previous_7_days_to: str


class UserAverage(BaseModel):
    user_id: int
    name: str
    entries_count: int
    average_daily_calories: float


class ReportsOut(BaseModel):
    week_comparison: WeekComparison
    per_user_averages: list[UserAverage]
    overall_average_daily_calories: float
