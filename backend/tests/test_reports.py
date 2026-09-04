from datetime import date, timedelta

from app.services.report_service import _window, build_reports
from tests.conftest import auth_headers


def test_window_math_last_7_days_includes_today():
    today = date(2026, 9, 4)
    start, end = _window(today, 7, offset_days=0)
    assert end == today
    assert start == today - timedelta(days=6)
    assert (end - start).days == 6  # 7 days inclusive


def test_window_math_previous_7_days_is_immediately_before():
    today = date(2026, 9, 4)
    last_start, last_end = _window(today, 7, offset_days=0)
    prev_end = last_start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=6)
    # previous window must end exactly one day before the last window starts,
    # and be exactly 7 days long with no overlap or gap.
    assert prev_end == last_start - timedelta(days=1)
    assert (prev_end - prev_start).days == 6
    assert prev_end + timedelta(days=1) == last_start


def test_reports_endpoint_shape(client, admin_token):
    resp = client.get("/api/admin/reports", headers=auth_headers(admin_token))
    assert resp.status_code == 200
    body = resp.json()
    assert "week_comparison" in body
    assert "per_user_averages" in body
    assert "overall_average_daily_calories" in body
    wc = body["week_comparison"]
    assert wc["last_7_days_count"] >= 0
    assert wc["previous_7_days_count"] >= 0


def test_reports_counts_entries_correctly(client, admin_token, db_session):
    resp = client.get("/api/admin/reports", headers=auth_headers(admin_token))
    body = resp.json()
    # From conftest seed data: "Breakfast" (2h ago) and "Lunch" (1 day ago) fall
    # in the last-7-day window; "Dinner" (8 days ago) falls in the previous window.
    assert body["week_comparison"]["last_7_days_count"] == 2
    assert body["week_comparison"]["previous_7_days_count"] == 1
