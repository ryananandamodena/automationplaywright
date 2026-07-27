from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.project import Project
from app.models.environment import Environment
from app.models.exploration import Exploration
from app.schemas.exploration import ExplorationCreate, ExplorationResponse

router = APIRouter()


import asyncio
from datetime import datetime
from app.db.session import SessionLocal
from app.models.page import Page

async def _mock_exploration_task(exploration_id: str):
    await asyncio.sleep(1)
    db = SessionLocal()
    try:
        exploration = db.query(Exploration).filter(Exploration.id == exploration_id).first()
        if not exploration:
            return
            
        exploration.status = "RUNNING"
        exploration.progress = 10
        exploration.started_at = datetime.utcnow()
        db.commit()
        
        await asyncio.sleep(2)
        
        exploration.progress = 50
        pages = [
            Page(exploration_id=exploration_id, url="https://example.com/home", title="Home Page", page_name="Home", dom_snapshot="<html><body><h1>Home</h1></body></html>"),
            Page(exploration_id=exploration_id, url="https://example.com/login", title="Login", page_name="Login", dom_snapshot="<html><body><form></form></body></html>"),
            Page(exploration_id=exploration_id, url="https://example.com/dashboard", title="Dashboard", page_name="Dashboard", dom_snapshot="<html><body><div>Dash</div></body></html>")
        ]
        db.add_all(pages)
        db.commit()
        
        await asyncio.sleep(2)
        
        exploration.status = "COMPLETED"
        exploration.progress = 100
        exploration.completed_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Exploration {exploration_id} failed: {e}")
        exploration.status = "FAILED"
        db.commit()
    finally:
        db.close()

def _trigger_exploration_task(exploration_id: str):
    """Run exploration in a background asyncio task for local testing without Celery."""
    asyncio.create_task(_mock_exploration_task(exploration_id))


@router.post("/explorations", response_model=ExplorationResponse, status_code=201)
def create_exploration(
    *,
    db: Session = Depends(deps.get_db),
    exploration_in: ExplorationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Trigger a new web exploration.
    The exploration runs asynchronously via Celery worker.
    """
    # Validate project ownership
    project = db.query(Project).filter(
        Project.id == str(exploration_in.project_id),
        Project.user_id == current_user.id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate environment belongs to this project
    environment = db.query(Environment).filter(
        Environment.id == str(exploration_in.environment_id),
        Environment.project_id == str(exploration_in.project_id),
    ).first()
    if not environment:
        raise HTTPException(status_code=404, detail="Environment not found in this project")

    # Create exploration record
    exploration = Exploration(
        project_id=exploration_in.project_id,
        environment_id=exploration_in.environment_id,
        status="PENDING",
        progress=0,
    )
    db.add(exploration)
    db.commit()
    db.refresh(exploration)

    # Dispatch background task
    exploration_id = str(exploration.id)
    background_tasks.add_task(_trigger_exploration_task, exploration_id)

    return exploration


@router.get("/projects/{project_id}/explorations", response_model=List[ExplorationResponse])
def list_explorations(
    *,
    db: Session = Depends(deps.get_db),
    project_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List all explorations for a project."""
    project = db.query(Project).filter(
        Project.id == project_id, Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    explorations = db.query(Exploration).filter(
        Exploration.project_id == project_id
    ).order_by(Exploration.created_at.desc()).all()
    return explorations


@router.get("/explorations/{id}", response_model=ExplorationResponse)
def get_exploration(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get exploration status and details by ID."""
    exploration = db.query(Exploration).join(Project).filter(
        Exploration.id == id,
        Project.user_id == current_user.id,
    ).first()
    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")
    return exploration


@router.delete("/explorations/{id}", response_model=ExplorationResponse)
def delete_exploration(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Delete an exploration and all its discovered pages."""
    exploration = db.query(Exploration).join(Project).filter(
        Exploration.id == id,
        Project.user_id == current_user.id,
    ).first()
    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")

    # Only allow deletion of non-running explorations
    if exploration.status == "RUNNING":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a running exploration. Wait for it to complete or fail."
        )

    db.delete(exploration)
    db.commit()
    return exploration
