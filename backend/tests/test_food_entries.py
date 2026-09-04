from datetime import datetime, timedelta

from tests.conftest import auth_headers


def test_user_only_sees_own_entries(client, user_token):
    resp = client.get("/api/food-entries", headers=auth_headers(user_token))
    assert resp.status_code == 200
    entries = resp.json()
    assert len(entries) == 2
    assert all(e["food_name"] in ("Breakfast", "Lunch") for e in entries)


def test_user_cannot_update_other_users_entry(client, user_token, user2_token):
    my_entries = client.get("/api/food-entries", headers=auth_headers(user2_token)).json()
    other_id = my_entries[0]["id"]
    resp = client.put(
        f"/api/food-entries/{other_id}",
        headers=auth_headers(user_token),
        json={"calories": 111},
    )
    assert resp.status_code == 404


def test_user_cannot_delete_other_users_entry(client, user_token, user2_token):
    entries = client.get("/api/food-entries", headers=auth_headers(user2_token)).json()
    other_id = entries[0]["id"]
    resp = client.delete(f"/api/food-entries/{other_id}", headers=auth_headers(user_token))
    assert resp.status_code == 404


def test_create_entry_valid(client, user_token):
    payload = {
        "food_name": "Test Meal",
        "calories": 500,
        "consumed_at": datetime.now().isoformat(),
        "from_fdc": False,
    }
    resp = client.post("/api/food-entries", headers=auth_headers(user_token), json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["food_name"] == "Test Meal"
    assert body["calories"] == 500


def test_create_entry_rejects_negative_calories(client, user_token):
    payload = {"food_name": "Bad", "calories": -10, "consumed_at": datetime.now().isoformat()}
    resp = client.post("/api/food-entries", headers=auth_headers(user_token), json=payload)
    assert resp.status_code == 422


def test_create_entry_rejects_zero_calories(client, user_token):
    payload = {"food_name": "Bad", "calories": 0, "consumed_at": datetime.now().isoformat()}
    resp = client.post("/api/food-entries", headers=auth_headers(user_token), json=payload)
    assert resp.status_code == 422


def test_create_entry_rejects_over_cap_calories(client, user_token):
    payload = {"food_name": "Bad", "calories": 5001, "consumed_at": datetime.now().isoformat()}
    resp = client.post("/api/food-entries", headers=auth_headers(user_token), json=payload)
    assert resp.status_code == 422


def test_create_entry_rejects_short_name(client, user_token):
    payload = {"food_name": "A", "calories": 200, "consumed_at": datetime.now().isoformat()}
    resp = client.post("/api/food-entries", headers=auth_headers(user_token), json=payload)
    assert resp.status_code == 422


def test_create_entry_rejects_future_date(client, user_token):
    future = (datetime.now() + timedelta(days=2)).isoformat()
    payload = {"food_name": "Future Food", "calories": 200, "consumed_at": future}
    resp = client.post("/api/food-entries", headers=auth_headers(user_token), json=payload)
    assert resp.status_code == 422


def test_update_own_entry_succeeds(client, user_token):
    entries = client.get("/api/food-entries", headers=auth_headers(user_token)).json()
    entry_id = entries[0]["id"]
    resp = client.put(
        f"/api/food-entries/{entry_id}", headers=auth_headers(user_token), json={"calories": 321}
    )
    assert resp.status_code == 200
    assert resp.json()["calories"] == 321


def test_delete_own_entry_succeeds(client, user_token):
    entries = client.get("/api/food-entries", headers=auth_headers(user_token)).json()
    entry_id = entries[0]["id"]
    resp = client.delete(f"/api/food-entries/{entry_id}", headers=auth_headers(user_token))
    assert resp.status_code == 204
    remaining = client.get("/api/food-entries", headers=auth_headers(user_token)).json()
    assert all(e["id"] != entry_id for e in remaining)


def test_date_range_filter(client, user_token):
    today = datetime.now().date().isoformat()
    resp = client.get(
        f"/api/food-entries?date_from={today}&date_to={today}", headers=auth_headers(user_token)
    )
    assert resp.status_code == 200
    entries = resp.json()
    assert all(e["food_name"] == "Breakfast" for e in entries)
