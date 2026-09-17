from datetime import datetime

from app.services import food_entry_service as svc
from tests.conftest import make_entry


def test_get_total_calories_sums_only_given_user(db_session, user, other_user):
    make_entry(db_session, user, calories=300)
    make_entry(db_session, user, calories=200)
    make_entry(db_session, other_user, calories=1000)

    assert svc.get_total_calories(db_session, user.id) == 500
    assert svc.get_total_calories(db_session, other_user.id) == 1000


def test_get_total_calories_respects_date_range(db_session, user, make_entries):
    make_entries(user, [(0, 100), (1, 200), (2, 300)])  # 2026-09-01, 09-02, 09-03

    total = svc.get_total_calories(
        db_session,
        user.id,
        date_from=datetime(2026, 9, 2, 0, 0, 0),
        date_to=datetime(2026, 9, 2, 23, 59, 59),
    )
    assert total == 200


def test_get_total_calories_with_no_entries_is_zero(db_session, user):
    assert svc.get_total_calories(db_session, user.id) == 0
