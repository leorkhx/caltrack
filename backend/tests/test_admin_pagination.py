from datetime import datetime, timedelta

from app.services import food_entry_service as svc
from tests.conftest import make_entry


def test_cursor_pagination_no_overlap_or_gaps(db_session, user, make_entries):
    make_entries(user, [(i, 100 + i) for i in range(25)])  # 25 entries, one per day

    seen_ids = []
    cursor = None
    for _ in range(10):  # more than enough pages to exhaust 25 entries at page_size 5
        items, total, next_cursor = svc.list_entries_admin(db_session, cursor=cursor, page_size=5)
        assert total == 25
        seen_ids.extend(e.id for e in items)
        if next_cursor is None:
            break
        cursor = next_cursor

    assert len(seen_ids) == 25
    assert len(set(seen_ids)) == 25  # no duplicates across pages


def test_cursor_pagination_date_desc_order(db_session, user, make_entries):
    entries = make_entries(user, [(0, 100), (1, 200), (2, 300)])
    items, _, _ = svc.list_entries_admin(db_session, page_size=10, sort="date_desc")
    assert [e.id for e in items] == [entries[2].id, entries[1].id, entries[0].id]


def test_cursor_pagination_calories_asc_order(db_session, user, make_entries):
    entries = make_entries(user, [(0, 300), (1, 100), (2, 200)])
    items, _, _ = svc.list_entries_admin(db_session, page_size=10, sort="calories_asc")
    assert [e.id for e in items] == [entries[1].id, entries[2].id, entries[0].id]


def test_day_status_over_and_within_limit(db_session, user):
    # user's daily_calorie_limit is 2000 (see conftest)
    over_day = datetime(2026, 9, 1, 8, 0, 0)
    within_day = datetime(2026, 9, 2, 8, 0, 0)
    make_entry(db_session, user, calories=2500, consumed_at=over_day)
    make_entry(db_session, user, calories=500, consumed_at=within_day)

    over_items, over_total, _ = svc.list_entries_admin(db_session, page_size=10, day_status="over")
    within_items, within_total, _ = svc.list_entries_admin(db_session, page_size=10, day_status="within")

    assert over_total == 1 and over_items[0].calories == 2500
    assert within_total == 1 and within_items[0].calories == 500


def test_search_filters_by_food_name(db_session, user, make_entries):
    make_entry(db_session, user, food_name="Banana split")
    make_entry(db_session, user, food_name="Grilled chicken")

    items, total, _ = svc.list_entries_admin(db_session, page_size=10, search="banana")
    assert total == 1
    assert items[0].food_name == "Banana split"
