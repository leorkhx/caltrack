import enum
from typing import Optional

from sqlalchemy import Enum, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class BiologicalSex(str, enum.Enum):
    male = "male"
    female = "female"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, native_enum=False, length=20), nullable=False, default=UserRole.user)
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    daily_calorie_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=2100)
    protein_target_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    carbs_target_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    fat_target_g: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    height_cm: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    sex: Mapped[Optional[BiologicalSex]] = mapped_column(Enum(BiologicalSex, native_enum=False, length=10), nullable=True)

    food_entries = relationship("FoodEntry", back_populates="user", cascade="all, delete-orphan")
    favorite_foods = relationship("FavoriteFood", back_populates="user", cascade="all, delete-orphan")
