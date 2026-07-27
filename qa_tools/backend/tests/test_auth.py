"""Tests for authentication endpoints."""
import pytest


def test_register_success(client):
    """Test successful user registration."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "new@test.com", "password": "password123", "role": "QA_ENGINEER"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new@test.com"
    assert data["role"] == "QA_ENGINEER"
    assert "id" in data
    assert "password" not in data  # password should not be returned


def test_register_duplicate_email(client, registered_user):
    """Test that registering with same email fails."""
    response = client.post(
        "/api/v1/auth/register",
        json={"email": registered_user["email"], "password": "anotherpassword"},
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_login_success(client, registered_user):
    """Test successful login returns access token."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": registered_user["email"],
            "password": registered_user["password"],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 10


def test_login_wrong_password(client, registered_user):
    """Test login with wrong password fails."""
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": registered_user["email"],
            "password": "wrongpassword",
        },
    )
    assert response.status_code == 400


def test_login_nonexistent_user(client):
    """Test login with non-existent email fails."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "ghost@test.com", "password": "anything"},
    )
    assert response.status_code == 400


def test_protected_route_without_token(client):
    """Test that protected routes reject requests without token."""
    response = client.get("/api/v1/projects/")
    assert response.status_code == 401


def test_protected_route_with_invalid_token(client):
    """Test that protected routes reject invalid tokens."""
    response = client.get(
        "/api/v1/projects/",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401
