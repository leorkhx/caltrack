import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class MealType(str, enum.Enum):
    breakfast = "breakfast"
    lunch = "lunch"
    dinner = "dinner"
    snack = "snack"


class QuantityUnit(str, enum.Enum):
    g = "g"
    kg = "kg"
    ml = "ml"
    l = "l"
    oz = "oz"
    lb = "lb"
    cup = "cup"
    tbsp = "tbsp"
    tsp = "tsp"
    piece = "piece"
    serving = "serving"


class FoodEntry(Base):
    __tablename__ = "food_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    food_name: Mapped[str] = mapped_column(String(200), nullable=False)
    calories: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    unit: Mapped[QuantityUnit] = mapped_column(
        Enum(QuantityUnit, native_enum=False, length=20), nullable=False, default=QuantityUnit.serving
    )
    meal_type: Mapped[MealType] = mapped_column(
        Enum(MealType, native_enum=False, length=20), nullable=False, default=MealType.snack
    )
    protein_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    carbs_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fat_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    consumed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    from_fdc: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="food_entries")
