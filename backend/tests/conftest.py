import os
from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
os.environ.setdefault("USER_TOKEN", "test-user-token")
os.environ.setdefault("USER2_TOKEN", "test-user2-token")
os.environ.setdefault("ADMIN_TOKEN", "test-admin-token")

from app.config import get_settings  # noqa: E402
from app.database import Base, get_db  # noqa: E402
from app.dependencies.auth import hash_token  # noqa: E402
from app.main import app  # noqa: E402
from app.models.food_entry import FoodEntry  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402

TEST_DB_PATH = "./test.db"
TEST_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function", autouse=True)
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    settings = get_settings()
    db = TestingSessionLocal()
    user = User(
        name="Test User",
        email="testuser@example.com",
        role=UserRole.user,
        token_hash=hash_token(settings.user_token),
        daily_calorie_limit=2100,
    )
    user2 = User(
        name="Test User Two",
        email="testuser2@example.com",
        role=UserRole.user,
        token_hash=hash_token(settings.user2_token),
        daily_calorie_limit=2500,
    )
    admin = User(
        name="Test Admin",
        email="testadmin@example.com",
        role=UserRole.admin,
        token_hash=hash_token(settings.admin_token),
        daily_calorie_limit=2100,
    )
    db.add_all([user, user2, admin])
    db.commit()
    db.refresh(user)
    db.refresh(user2)
    db.refresh(admin)

    now = datetime.now()
    db.add_all(
        [
            FoodEntry(user_id=user.id, food_name="Breakfast", calories=400, consumed_at=now - timedelta(hours=2)),
            FoodEntry(user_id=user.id, food_name="Lunch", calories=700, consumed_at=now - timedelta(days=1)),
            FoodEntry(user_id=user2.id, food_name="Dinner", calories=900, consumed_at=now - timedelta(days=8)),
        ]
    )
    db.commit()
    db.close()

    yield


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def user_token():
    return get_settings().user_token


@pytest.fixture
def user2_token():
    return get_settings().user2_token


@pytest.fixture
def admin_token():
    return get_settings().admin_token


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
