from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.database import Base


class FoodEntry(Base):
    __tablename__ = "food_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    food_name: Mapped[str] = mapped_column(String(200), nullable=False)
    calories: Mapped[int] = mapped_column(Integer, nullable=False)
    consumed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    from_fdc: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship("User", back_populates="food_entries")
