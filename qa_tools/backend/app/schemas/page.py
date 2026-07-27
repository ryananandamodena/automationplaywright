from typing import Optional, Any, Dict
from pydantic import BaseModel
from uuid import UUID


class PageResponse(BaseModel):
    id: UUID
    exploration_id: UUID
    url: str
    title: Optional[str] = None
    page_name: Optional[str] = None
    dom_snapshot: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
