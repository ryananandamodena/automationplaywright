from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
def read_projects(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve projects.
    """
    projects = db.query(Project).filter(Project.user_id == current_user.id).offset(skip).limit(limit).all()
    return projects

@router.post("/", response_model=ProjectResponse)
def create_project(
    *,
    db: Session = Depends(deps.get_db),
    project_in: ProjectCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new project.
    """
    project = Project(
        name=project_in.name,
        description=project_in.description,
        application_url=str(project_in.application_url),
        user_id=current_user.id
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{id}", response_model=ProjectResponse)
def read_project(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get project by ID.
    """
    project = db.query(Project).filter(Project.id == id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{id}", response_model=ProjectResponse)
def update_project(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    project_in: ProjectUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update a project.
    """
    project = db.query(Project).filter(Project.id == id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = project_in.model_dump(exclude_unset=True)
    if "application_url" in update_data and update_data["application_url"] is not None:
        update_data["application_url"] = str(update_data["application_url"])

    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{id}", response_model=ProjectResponse)
def delete_project(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Delete project.
    """
    project = db.query(Project).filter(Project.id == id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()
    return project
