POLYGON = {
    "type": "Polygon",
    "coordinates": [[[-70.9, -9.1], [-70.7, -9.1], [-70.7, -8.9], [-70.9, -8.9], [-70.9, -9.1]]],
}


def test_create_project_requires_auth(client):
    resp = client.post("/api/projects", json={"name": "No Auth Project"})
    assert resp.status_code == 401


def test_create_project_with_sites(client, auth_headers):
    resp = client.post(
        "/api/projects",
        json={
            "name": "Amazon Reforestation",
            "description": "Test project",
            "project_type": "carbon",
            "sites": [
                {"name": "Site A", "country": "Brazil", "geometry": POLYGON},
            ],
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    body = resp.get_json()["project"]
    assert body["name"] == "Amazon Reforestation"
    assert body["site_count"] == 1
    assert len(body["sites"]) == 1
    assert body["sites"][0]["geometry"]["type"] == "Polygon"


def test_list_and_get_project(client, auth_headers):
    create = client.post(
        "/api/projects", json={"name": "P1", "project_type": "biodiversity"}, headers=auth_headers
    )
    project_id = create.get_json()["project"]["id"]

    listing = client.get("/api/projects")
    assert listing.status_code == 200
    assert any(p["id"] == project_id for p in listing.get_json()["projects"])

    detail = client.get(f"/api/projects/{project_id}")
    assert detail.status_code == 200
    assert detail.get_json()["project"]["id"] == project_id


def test_invalid_project_type_rejected(client, auth_headers):
    resp = client.post(
        "/api/projects", json={"name": "Bad", "project_type": "not-a-real-type"}, headers=auth_headers
    )
    assert resp.status_code == 400


def test_add_site_to_project_and_fetch_metrics(client, auth_headers):
    create = client.post("/api/projects", json={"name": "P2"}, headers=auth_headers)
    project_id = create.get_json()["project"]["id"]

    site_resp = client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "New Site", "country": "Peru", "geometry": POLYGON},
        headers=auth_headers,
    )
    assert site_resp.status_code == 201
    site_id = site_resp.get_json()["site"]["id"]

    metric_resp = client.post(
        f"/api/sites/{site_id}/metrics",
        json={
            "recorded_date": "2024-01-01",
            "carbon_value": 100,
            "biodiversity_value": 40,
            "performance": 70,
        },
        headers=auth_headers,
    )
    assert metric_resp.status_code == 201

    metrics = client.get(f"/api/sites/{site_id}/metrics")
    assert metrics.status_code == 200
    assert len(metrics.get_json()["metrics"]) == 1

    all_sites = client.get("/api/sites")
    assert all_sites.status_code == 200
    assert any(s["id"] == site_id for s in all_sites.get_json()["sites"])


def test_add_site_rejects_invalid_geometry(client, auth_headers):
    create = client.post("/api/projects", json={"name": "P3"}, headers=auth_headers)
    project_id = create.get_json()["project"]["id"]

    resp = client.post(
        f"/api/projects/{project_id}/sites",
        json={"name": "Bad Site", "geometry": {"type": "LineString", "coordinates": []}},
        headers=auth_headers,
    )
    assert resp.status_code == 400
