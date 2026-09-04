from tests.conftest import auth_headers


def test_missing_token_is_401(client):
    resp = client.get("/api/food-entries")
    assert resp.status_code == 401


def test_invalid_token_is_401(client):
    resp = client.get("/api/food-entries", headers=auth_headers("not-a-real-token"))
    assert resp.status_code == 401


def test_valid_user_token_is_200(client, user_token):
    resp = client.get("/api/food-entries", headers=auth_headers(user_token))
    assert resp.status_code == 200


def test_users_me_returns_profile(client, user_token):
    resp = client.get("/api/users/me", headers=auth_headers(user_token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["role"] == "user"
    assert body["daily_calorie_limit"] == 2100
