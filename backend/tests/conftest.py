from datetime import datetime, timedelta

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

import app.models.favorite_food  # noqa: F401 - registers the FavoriteFood mapper
from app.database import Base
from app.models.food_entry import FoodEntry
from app.models.user import User, UserRole


@pytest.fixture()
def db_session():
    """A fresh in-memory SQLite DB per test — never touches the real app.db."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    session = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def user(db_session):
    u = User(
        name="Test User",
        email="test@example.com",
        role=UserRole.user,
        token_hash="test-hash",
        daily_calorie_limit=2000,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


@pytest.fixture()
def other_user(db_session):
    u = User(
        name="Other User",
        email="other@example.com",
        role=UserRole.user,
        token_hash="other-hash",
        daily_calorie_limit=2500,
    )
    db_session.add(u)
    db_session.commit()
    db_session.refresh(u)
    return u


def make_entry(db_session, user, *, calories=500, consumed_at=None, food_name="Test food"):
    entry = FoodEntry(
        user_id=user.id,
        food_name=food_name,
        calories=calories,
        quantity=1.0,
        consumed_at=consumed_at or datetime(2026, 9, 1, 12, 0, 0),
    )
    db_session.add(entry)
    db_session.commit()
    db_session.refresh(entry)
    return entry


@pytest.fixture()
def make_entries(db_session):
    def _make(user, specs):
        """specs: list of (days_offset_from_2026_09_01, calories) tuples."""
        base = datetime(2026, 9, 1, 12, 0, 0)
        return [
            make_entry(db_session, user, calories=cal, consumed_at=base + timedelta(days=offset))
            for offset, cal in specs
        ]

    return _make
