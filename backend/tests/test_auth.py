def test_register_and_login(client):
    resp = client.post(
        "/api/auth/register",
        json={"name": "Jane Doe", "email": "jane@example.com", "password": "secret123"},
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["user"]["email"] == "jane@example.com"
    assert "access_token" in body

    resp = client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "secret123"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.get_json()


def test_login_with_wrong_password_fails(client):
    client.post(
        "/api/auth/register",
        json={"name": "Jane Doe", "email": "jane@example.com", "password": "secret123"},
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "jane@example.com", "password": "wrong"},
    )
    assert resp.status_code == 401


def test_duplicate_registration_rejected(client):
    payload = {"name": "Jane Doe", "email": "jane@example.com", "password": "secret123"}
    client.post("/api/auth/register", json=payload)
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


def test_me_requires_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
