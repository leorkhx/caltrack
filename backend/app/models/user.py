import enum

from sqlalchemy import Enum, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, native_enum=False, length=20), nullable=False, default=UserRole.user)
    # Hash of the bearer token used to authenticate as this user. Plaintext tokens
    # only ever live in env vars / config, never in the DB.
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    # Per-user daily calorie limit (kcal). Easy to override per user: edit this
    # column value directly (e.g. `UPDATE users SET daily_calorie_limit = ...`).
    daily_calorie_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=2100)

    food_entries = relationship("FoodEntry", back_populates="user", cascade="all, delete-orphan")
