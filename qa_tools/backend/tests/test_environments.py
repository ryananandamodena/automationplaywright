"""Tests for environments CRUD endpoints."""
import pytest

PROJECT_DATA = {
    "name": "Test Project",
    "application_url": "https://testapp.com",
}

ENV_DATA = {
    "name": "Staging",
    "base_url": "https://staging.testapp.com",
}


@pytest.fixture
def project(client, auth_headers):
    """Create a project fixture."""
    return client.post("/api/v1/projects/", json=PROJECT_DATA, headers=auth_headers).json()


def test_create_environment(client, auth_headers, project):
    """Test creating an environment for a project."""
    response = client.post(
        f"/api/v1/projects/{project['id']}/environments",
        json=ENV_DATA,
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == ENV_DATA["name"]
    assert data["base_url"] == ENV_DATA["base_url"]
    assert data["project_id"] == project["id"]


def test_create_environment_with_auth(client, auth_headers, project):
    """Test creating an environment with authentication credentials."""
    response = client.post(
        f"/api/v1/projects/{project['id']}/environments",
        json={
            **ENV_DATA,
            "auth_username": "admin",
            "auth_password": "secret123",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["auth_username"] == "admin"
    # Password should never be returned in plain text
    assert "auth_password" not in data or data.get("auth_password") is None


def test_list_environments(client, auth_headers, project):
    """Test listing environments for a project."""
    # Create two environments
    client.post(f"/api/v1/projects/{project['id']}/environments", json=ENV_DATA, headers=auth_headers)
    client.post(
        f"/api/v1/projects/{project['id']}/environments",
        json={**ENV_DATA, "name": "Production"},
        headers=auth_headers,
    )

    response = client.get(
        f"/api/v1/projects/{project['id']}/environments",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_list_environments_empty(client, auth_headers, project):
    """Test listing environments returns empty list when none exist."""
    response = client.get(
        f"/api/v1/projects/{project['id']}/environments",
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json() == []


def test_delete_environment(client, auth_headers, project):
    """Test deleting an environment."""
    env = client.post(
        f"/api/v1/projects/{project['id']}/environments",
        json=ENV_DATA,
        headers=auth_headers,
    ).json()

    delete_response = client.delete(f"/api/v1/environments/{env['id']}", headers=auth_headers)
    assert delete_response.status_code == 200

    # Verify it's gone
    list_response = client.get(
        f"/api/v1/projects/{project['id']}/environments", headers=auth_headers
    )
    assert list_response.json() == []


def test_environment_wrong_project(client, auth_headers, project):
    """Test cannot create environment for project that doesn't belong to user."""
    fake_project_id = "00000000-0000-0000-0000-000000000000"
    response = client.post(
        f"/api/v1/projects/{fake_project_id}/environments",
        json=ENV_DATA,
        headers=auth_headers,
    )
    assert response.status_code == 404
