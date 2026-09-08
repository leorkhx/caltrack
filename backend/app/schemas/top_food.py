from typing import Optional

from pydantic import BaseModel


class TopFood(BaseModel):
    food_name: str
    entries_count: int
    total_calories: int
    average_calories: float


class TopFoodsOut(BaseModel):
    period_days: Optional[int]  # None means all-time
    items: list[TopFood]
    total: int
    page: int
    page_size: int
