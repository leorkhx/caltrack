from tests.conftest import auth_headers


def test_non_admin_gets_403_on_admin_entries(client, user_token):
    resp = client.get("/api/admin/food-entries", headers=auth_headers(user_token))
    assert resp.status_code == 403


def test_non_admin_gets_403_on_reports(client, user_token):
    resp = client.get("/api/admin/reports", headers=auth_headers(user_token))
    assert resp.status_code == 403


def test_non_admin_gets_403_on_admin_users(client, user_token):
    resp = client.get("/api/admin/users", headers=auth_headers(user_token))
    assert resp.status_code == 403


def test_admin_sees_all_entries(client, admin_token):
    resp = client.get("/api/admin/food-entries", headers=auth_headers(admin_token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 3


def test_admin_can_filter_by_user(client, admin_token, user2_token):
    users = client.get("/api/admin/users", headers=auth_headers(admin_token)).json()
    user2 = next(u for u in users if u["email"] == "testuser2@example.com")
    resp = client.get(
        f"/api/admin/food-entries?user_id={user2['id']}", headers=auth_headers(admin_token)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["items"][0]["food_name"] == "Dinner"


def test_admin_can_create_entry_for_any_user(client, admin_token):
    users = client.get("/api/admin/users", headers=auth_headers(admin_token)).json()
    target = users[0]
    payload = {
        "user_id": target["id"],
        "food_name": "Admin Added Meal",
        "calories": 300,
        "consumed_at": "2026-01-01T12:00:00",
    }
    resp = client.post("/api/admin/food-entries", headers=auth_headers(admin_token), json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["user_id"] == target["id"]
    assert body["user_name"] == target["name"]


def test_admin_can_delete_any_entry(client, admin_token, user_token):
    entries = client.get("/api/food-entries", headers=auth_headers(user_token)).json()
    entry_id = entries[0]["id"]
    resp = client.delete(f"/api/admin/food-entries/{entry_id}", headers=auth_headers(admin_token))
    assert resp.status_code == 204
