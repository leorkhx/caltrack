from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_CALORIES = 5000
MIN_NAME_LEN = 2


class FoodEntryBase(BaseModel):
    food_name: str = Field(..., min_length=MIN_NAME_LEN, max_length=200)
    calories: int = Field(..., gt=0, le=MAX_CALORIES)
    consumed_at: datetime
    from_fdc: bool = False

    @field_validator("food_name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < MIN_NAME_LEN:
            raise ValueError(f"Food name must be at least {MIN_NAME_LEN} characters.")
        return v

    @field_validator("consumed_at")
    @classmethod
    def not_in_future(cls, v: datetime) -> datetime:
        now = datetime.now(timezone.utc)
        compare = v if v.tzinfo else v.replace(tzinfo=timezone.utc)
        # allow a small grace window for clock skew
        if compare > now.replace(microsecond=0) and (compare - now).total_seconds() > 60:
            raise ValueError("Date/time cannot be in the future.")
        return v


class FoodEntryCreate(FoodEntryBase):
    """Used by the regular /api/food-entries endpoint (always for self)."""


class AdminFoodEntryCreate(FoodEntryBase):
    user_id: int


class FoodEntryUpdate(BaseModel):
    food_name: Optional[str] = Field(None, min_length=MIN_NAME_LEN, max_length=200)
    calories: Optional[int] = Field(None, gt=0, le=MAX_CALORIES)
    consumed_at: Optional[datetime] = None
    from_fdc: Optional[bool] = None
    user_id: Optional[int] = None  # only honored for admin updates

    @field_validator("food_name")
    @classmethod
    def name_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < MIN_NAME_LEN:
            raise ValueError(f"Food name must be at least {MIN_NAME_LEN} characters.")
        return v

    @field_validator("consumed_at")
    @classmethod
    def not_in_future(cls, v: Optional[datetime]) -> Optional[datetime]:
        if v is None:
            return v
        now = datetime.now(timezone.utc)
        compare = v if v.tzinfo else v.replace(tzinfo=timezone.utc)
        if compare > now.replace(microsecond=0) and (compare - now).total_seconds() > 60:
            raise ValueError("Date/time cannot be in the future.")
        return v


class FoodEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    food_name: str
    calories: int
    consumed_at: datetime
    from_fdc: bool
    created_at: datetime
    updated_at: datetime


class AdminFoodEntryOut(FoodEntryOut):
    user_name: str
    user_daily_limit: int


class PaginatedAdminFoodEntries(BaseModel):
    items: list[AdminFoodEntryOut]
    total: int
    page: int
    page_size: int
