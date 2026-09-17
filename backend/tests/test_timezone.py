"""Regression tests for the timezone bugs fixed this session:
- consumed_at must serialize with an explicit UTC marker ("Z"), or the
  browser silently reinterprets it as already being in the viewer's local
  time instead of converting it.
- day-grouping (admin stats, reports) must shift by the viewer's timezone
  offset instead of grouping by the raw UTC calendar day.
"""

from datetime import datetime

from app.schemas.food_entry import FoodEntryOut
from app.services import food_entry_service as svc
from app.services import report_service
from tests.conftest import make_entry


def test_food_entry_out_marks_naive_datetimes_as_utc(db_session, user):
    entry = make_entry(db_session, user, consumed_at=datetime(2026, 9, 5, 17, 5, 0))
    out = FoodEntryOut.model_validate(entry)
    serialized = out.model_dump_json()
    assert '"consumed_at":"2026-09-05T17:05:00Z"' in serialized


def test_admin_day_stats_since_shifts_with_offset(db_session, user):
    # 2026-09-01T02:00:00 UTC is still "2026-08-31" evening in a UTC-3 timezone.
    make_entry(db_session, user, consumed_at=datetime(2026, 9, 1, 2, 0, 0), calories=300)

    utc_stats = svc.get_admin_day_stats(db_session, tz_offset_minutes=0)
    behind_utc_stats = svc.get_admin_day_stats(db_session, tz_offset_minutes=180)  # UTC-3

    assert utc_stats["since"] == "2026-09-01"
    assert behind_utc_stats["since"] == "2026-08-31"


def test_admin_day_stats_days_over_limit_respects_local_day_boundary(db_session, user):
    # Two entries that land on the same UTC day but different local (UTC-3)
    # days should be treated as two separate days for the limit check.
    make_entry(db_session, user, consumed_at=datetime(2026, 9, 1, 1, 0, 0), calories=1800)  # 2026-08-31 22:00 local
    make_entry(db_session, user, consumed_at=datetime(2026, 9, 1, 20, 0, 0), calories=1800)  # 2026-09-01 17:00 local

    utc_stats = svc.get_admin_day_stats(db_session, tz_offset_minutes=0)
    local_stats = svc.get_admin_day_stats(db_session, tz_offset_minutes=180)

    assert utc_stats["days_over_limit"] == 1  # summed into one UTC day: 3600 > 2000
    assert local_stats["days_over_limit"] == 0  # split across two local days: 1800 each, both within limit


def test_build_reports_today_shifts_with_offset(db_session):
    # A UTC offset ahead of UTC (e.g. Tokyo, -540) should report a "current_to"
    # date at or after the same value computed with no offset.
    utc_report = report_service.build_reports(db_session, days=1, tz_offset_minutes=0)
    ahead_report = report_service.build_reports(db_session, days=1, tz_offset_minutes=-540)
    behind_report = report_service.build_reports(db_session, days=1, tz_offset_minutes=180)

    assert ahead_report.period_comparison.current_to >= utc_report.period_comparison.current_to
    assert behind_report.period_comparison.current_to <= utc_report.period_comparison.current_to
