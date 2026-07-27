from typing import Optional
from pydantic import BaseModel, HttpUrl
from uuid import UUID
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    application_url: HttpUrl

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    application_url: Optional[HttpUrl] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: UUID
    user_id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
