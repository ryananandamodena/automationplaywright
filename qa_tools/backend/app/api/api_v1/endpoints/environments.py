from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.core import security
from app.models.user import User
from app.models.project import Project
from app.models.environment import Environment
from app.schemas.environment import EnvironmentCreate, EnvironmentUpdate, EnvironmentResponse

router = APIRouter()


@router.get("/projects/{project_id}/environments", response_model=List[EnvironmentResponse])
def list_environments(
    *,
    db: Session = Depends(deps.get_db),
    project_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List all environments for a project."""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    environments = db.query(Environment).filter(
        Environment.project_id == project_id
    ).all()
    return environments


@router.post("/projects/{project_id}/environments", response_model=EnvironmentResponse)
def create_environment(
    *,
    db: Session = Depends(deps.get_db),
    project_id: str,
    env_in: EnvironmentCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Create a new environment for a project."""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Encrypt password if provided
    encrypted_password = None
    if env_in.auth_password:
        encrypted_password = security.encrypt_value(env_in.auth_password)

    env = Environment(
        project_id=project_id,
        name=env_in.name,
        base_url=str(env_in.base_url),
        auth_username=env_in.auth_username,
        auth_password_encrypted=encrypted_password,
        additional_headers=env_in.additional_headers,
        env_variables=env_in.env_variables,
    )
    db.add(env)
    db.commit()
    db.refresh(env)
    return env


@router.get("/environments/{id}", response_model=EnvironmentResponse)
def get_environment(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get an environment by ID."""
    env = db.query(Environment).join(Project).filter(
        Environment.id == id,
        Project.user_id == current_user.id,
    ).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    return env


@router.put("/environments/{id}", response_model=EnvironmentResponse)
def update_environment(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    env_in: EnvironmentUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update an environment."""
    env = db.query(Environment).join(Project).filter(
        Environment.id == id,
        Project.user_id == current_user.id,
    ).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    update_data = env_in.model_dump(exclude_unset=True)

    # Handle password encryption separately
    if "auth_password" in update_data:
        raw_password = update_data.pop("auth_password")
        if raw_password:
            env.auth_password_encrypted = security.encrypt_value(raw_password)
        else:
            env.auth_password_encrypted = None

    # Apply base_url as string
    if "base_url" in update_data and update_data["base_url"] is not None:
        update_data["base_url"] = str(update_data["base_url"])

    for field, value in update_data.items():
        setattr(env, field, value)

    db.commit()
    db.refresh(env)
    return env


@router.delete("/environments/{id}", response_model=EnvironmentResponse)
def delete_environment(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Delete an environment."""
    env = db.query(Environment).join(Project).filter(
        Environment.id == id,
        Project.user_id == current_user.id,
    ).first()
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    db.delete(env)
    db.commit()
    return env
