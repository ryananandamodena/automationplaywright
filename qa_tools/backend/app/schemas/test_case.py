from typing import Optional, List, Any, Dict
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class TestCaseResponse(BaseModel):
    id: UUID
    exploration_id: UUID
    page_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    priority: str
    test_type: str
    steps: Optional[List[str]] = None
    expected_result: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class TestCaseUpdate(BaseModel):
    status: Optional[str] = None  # APPROVED, REJECTED
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    steps: Optional[List[str]] = None
    expected_result: Optional[str] = None
