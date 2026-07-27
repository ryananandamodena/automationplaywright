from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.project import Project
from app.models.exploration import Exploration
from app.models.page import Page
from app.schemas.page import PageResponse

router = APIRouter()


@router.get("/explorations/{exploration_id}/pages", response_model=List[PageResponse])
def list_pages(
    *,
    db: Session = Depends(deps.get_db),
    exploration_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List all discovered pages for an exploration."""
    # Verify ownership via project
    exploration = db.query(Exploration).join(Project).filter(
        Exploration.id == exploration_id,
        Project.user_id == current_user.id,
    ).first()
    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")

    pages = db.query(Page).filter(Page.exploration_id == exploration_id).all()
    return pages


@router.get("/pages/{id}", response_model=PageResponse)
def get_page(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Get a specific discovered page with its DOM snapshot."""
    page = db.query(Page).join(Exploration).join(Project).filter(
        Page.id == id,
        Project.user_id == current_user.id,
    ).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page
