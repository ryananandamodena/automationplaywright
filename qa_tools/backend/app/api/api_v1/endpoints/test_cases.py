from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import asyncio

from app.api import deps
from app.models.user import User
from app.models.project import Project
from app.models.exploration import Exploration
from app.models.page import Page
from app.models.test_case import TestCase
from app.schemas.test_case import TestCaseResponse, TestCaseUpdate
from app.services.ai_service import generate_test_cases

router = APIRouter()


async def _run_generation(
    exploration_id: str,
    project_name: str,
    db: Session,
) -> None:
    """Background task: call AI, save test cases to DB."""
    exploration = db.query(Exploration).filter(Exploration.id == exploration_id).first()
    if not exploration:
        return

    pages = db.query(Page).filter(Page.exploration_id == exploration_id).all()
    pages_data = [
        {
            "url": p.url,
            "title": p.title,
            "page_name": p.page_name,
            "dom_snapshot": p.dom_snapshot,
        }
        for p in pages
    ]

    # Generate via AI service (handles mock/real internally)
    test_cases_data = await generate_test_cases(pages_data, project_name)

    # Persist to DB
    page_map = {p.url: p.id for p in pages}
    for tc_data in test_cases_data:
        # Try to associate test case with a page if steps reference a URL
        page_id = None
        for url, pid in page_map.items():
            steps = tc_data.get("steps", [])
            if any(url in str(s) for s in steps):
                page_id = pid
                break

        tc = TestCase(
            exploration_id=exploration_id,
            page_id=page_id,
            title=tc_data.get("title", "Untitled Test"),
            description=tc_data.get("description"),
            priority=tc_data.get("priority", "MEDIUM"),
            test_type=tc_data.get("test_type", "FUNCTIONAL"),
            steps=tc_data.get("steps", []),
            expected_result=tc_data.get("expected_result"),
            status="DRAFT",
        )
        db.add(tc)

    db.commit()


def _trigger_generation(
    exploration_id: str,
    project_name: str,
    db: Session,
) -> None:
    """Sync wrapper to run async generation in background task."""
    asyncio.run(_run_generation(exploration_id, project_name, db))


@router.post(
    "/explorations/{exploration_id}/generate-tests",
    response_model=dict,
    status_code=202,
)
def generate_tests_for_exploration(
    *,
    db: Session = Depends(deps.get_db),
    exploration_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Trigger AI test case generation for an exploration.
    Generation runs in the background.
    Returns 202 Accepted immediately.
    """
    exploration = db.query(Exploration).join(Project).filter(
        Exploration.id == exploration_id,
        Project.user_id == current_user.id,
    ).first()
    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")

    if exploration.status not in ("COMPLETED",):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot generate tests for exploration with status '{exploration.status}'. "
                   "Exploration must be COMPLETED.",
        )

    # Check if already generated
    existing = db.query(TestCase).filter(
        TestCase.exploration_id == exploration_id
    ).count()
    if existing > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Test cases already generated ({existing} exist). Delete them first to re-generate.",
        )

    project = db.query(Project).filter(Project.id == exploration.project_id).first()
    project_name = project.name if project else "Unknown Project"

    background_tasks.add_task(_trigger_generation, exploration_id, project_name, db)

    return {
        "message": "Test case generation started",
        "exploration_id": exploration_id,
        "status": "GENERATING",
    }


@router.get(
    "/explorations/{exploration_id}/test-cases",
    response_model=List[TestCaseResponse],
)
def list_test_cases(
    *,
    db: Session = Depends(deps.get_db),
    exploration_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """List all test cases for an exploration."""
    exploration = db.query(Exploration).join(Project).filter(
        Exploration.id == exploration_id,
        Project.user_id == current_user.id,
    ).first()
    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")

    test_cases = db.query(TestCase).filter(
        TestCase.exploration_id == exploration_id
    ).order_by(TestCase.created_at).all()
    return test_cases


@router.patch("/test-cases/{id}", response_model=TestCaseResponse)
def update_test_case(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    tc_in: TestCaseUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update a test case (e.g., approve or reject it)."""
    tc = db.query(TestCase).join(Exploration).join(Project).filter(
        TestCase.id == id,
        Project.user_id == current_user.id,
    ).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    update_data = tc_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tc, field, value)

    db.commit()
    db.refresh(tc)
    return tc


@router.delete("/test-cases/{id}", response_model=TestCaseResponse)
def delete_test_case(
    *,
    db: Session = Depends(deps.get_db),
    id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Delete a test case."""
    tc = db.query(TestCase).join(Exploration).join(Project).filter(
        TestCase.id == id,
        Project.user_id == current_user.id,
    ).first()
    if not tc:
        raise HTTPException(status_code=404, detail="Test case not found")

    db.delete(tc)
    db.commit()
    return tc


@router.delete(
    "/explorations/{exploration_id}/test-cases",
    response_model=dict,
)
def delete_all_test_cases(
    *,
    db: Session = Depends(deps.get_db),
    exploration_id: str,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Delete all test cases for an exploration (allows re-generation)."""
    exploration = db.query(Exploration).join(Project).filter(
        Exploration.id == exploration_id,
        Project.user_id == current_user.id,
    ).first()
    if not exploration:
        raise HTTPException(status_code=404, detail="Exploration not found")

    deleted = db.query(TestCase).filter(
        TestCase.exploration_id == exploration_id
    ).delete()
    db.commit()
    return {"deleted": deleted}
