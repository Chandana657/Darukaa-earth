import pytest

from app import create_app
from app.extensions import db as _db


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        _db.create_all()
        yield app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    client.post(
        "/api/auth/register",
        json={"name": "Test Admin", "email": "test@darukaa.earth", "password": "password123"},
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "test@darukaa.earth", "password": "password123"},
    )
    token = resp.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
