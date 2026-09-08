from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.food_entry import QuantityUnit

MAX_CALORIES = 5000
MIN_NAME_LEN = 2
MAX_MACRO_GRAMS = 1000
MAX_QUANTITY = 1000


class FavoriteFoodCreate(BaseModel):
    food_name: str = Field(..., min_length=MIN_NAME_LEN, max_length=200)
    calories: int = Field(..., gt=0, le=MAX_CALORIES)
    quantity: float = Field(1.0, gt=0, le=MAX_QUANTITY)
    unit: QuantityUnit = QuantityUnit.serving
    protein_g: Optional[int] = Field(None, ge=0, le=MAX_MACRO_GRAMS)
    carbs_g: Optional[int] = Field(None, ge=0, le=MAX_MACRO_GRAMS)
    fat_g: Optional[int] = Field(None, ge=0, le=MAX_MACRO_GRAMS)
    from_fdc: bool = False

    @field_validator("food_name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if len(v) < MIN_NAME_LEN:
            raise ValueError(f"Food name must be at least {MIN_NAME_LEN} characters.")
        return v


class FavoriteFoodUpdate(BaseModel):
    food_name: Optional[str] = Field(None, min_length=MIN_NAME_LEN, max_length=200)
    calories: Optional[int] = Field(None, gt=0, le=MAX_CALORIES)
    quantity: Optional[float] = Field(None, gt=0, le=MAX_QUANTITY)
    unit: Optional[QuantityUnit] = None
    protein_g: Optional[int] = Field(None, ge=0, le=MAX_MACRO_GRAMS)
    carbs_g: Optional[int] = Field(None, ge=0, le=MAX_MACRO_GRAMS)
    fat_g: Optional[int] = Field(None, ge=0, le=MAX_MACRO_GRAMS)
    from_fdc: Optional[bool] = None

    @field_validator("food_name")
    @classmethod
    def name_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if len(v) < MIN_NAME_LEN:
            raise ValueError(f"Food name must be at least {MIN_NAME_LEN} characters.")
        return v


class FavoriteFoodOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    food_name: str
    calories: int
    quantity: float
    unit: QuantityUnit
    protein_g: Optional[int] = None
    carbs_g: Optional[int] = None
    fat_g: Optional[int] = None
    from_fdc: bool
    created_at: datetime
