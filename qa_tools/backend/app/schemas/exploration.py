from typing import Optional, List, Any, Dict
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class ExplorationCreate(BaseModel):
    project_id: UUID
    environment_id: UUID


class ExplorationResponse(BaseModel):
    id: UUID
    project_id: UUID
    environment_id: UUID
    status: str
    progress: int
    discovered_modules: Optional[List[Dict[str, Any]]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
