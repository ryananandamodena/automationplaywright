"""Tests for projects CRUD endpoints."""
import pytest


PROJECT_DATA = {
    "name": "Test Project",
    "description": "A test project",
    "application_url": "https://testapp.com",
}


def test_create_project(client, auth_headers):
    """Test creating a new project."""
    response = client.post("/api/v1/projects/", json=PROJECT_DATA, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == PROJECT_DATA["name"]
    assert data["application_url"] == PROJECT_DATA["application_url"]
    assert data["status"] == "ACTIVE"
    assert "id" in data


def test_list_projects_empty(client, auth_headers):
    """Test listing projects when none exist."""
    response = client.get("/api/v1/projects/", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_list_projects(client, auth_headers):
    """Test listing projects after creating some."""
    client.post("/api/v1/projects/", json=PROJECT_DATA, headers=auth_headers)
    client.post(
        "/api/v1/projects/",
        json={**PROJECT_DATA, "name": "Second Project"},
        headers=auth_headers,
    )
    response = client.get("/api/v1/projects/", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_project_by_id(client, auth_headers):
    """Test getting a specific project."""
    created = client.post("/api/v1/projects/", json=PROJECT_DATA, headers=auth_headers).json()
    response = client.get(f"/api/v1/projects/{created['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_nonexistent_project(client, auth_headers):
    """Test getting a project that doesn't exist returns 404."""
    response = client.get(
        "/api/v1/projects/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_update_project(client, auth_headers):
    """Test updating a project."""
    created = client.post("/api/v1/projects/", json=PROJECT_DATA, headers=auth_headers).json()
    response = client.put(
        f"/api/v1/projects/{created['id']}",
        json={"name": "Updated Project Name"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Project Name"
    assert response.json()["application_url"] == PROJECT_DATA["application_url"]  # unchanged


def test_delete_project(client, auth_headers):
    """Test deleting a project."""
    created = client.post("/api/v1/projects/", json=PROJECT_DATA, headers=auth_headers).json()
    delete_response = client.delete(
        f"/api/v1/projects/{created['id']}", headers=auth_headers
    )
    assert delete_response.status_code == 200

    # Verify it's gone
    get_response = client.get(f"/api/v1/projects/{created['id']}", headers=auth_headers)
    assert get_response.status_code == 404


def test_project_isolation_between_users(client, db):
    """Test users cannot see each other's projects."""
    # Register two users
    user1 = {"email": "user1@test.com", "password": "password123"}
    user2 = {"email": "user2@test.com", "password": "password123"}

    for user in [user1, user2]:
        client.post("/api/v1/auth/register", json=user)

    def login(user):
        resp = client.post("/api/v1/auth/login", data={"username": user["email"], "password": user["password"]})
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    headers1 = login(user1)
    headers2 = login(user2)

    # User1 creates a project
    client.post("/api/v1/projects/", json=PROJECT_DATA, headers=headers1)

    # User2 should see empty list
    response = client.get("/api/v1/projects/", headers=headers2)
    assert response.json() == []
