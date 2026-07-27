from typing import Optional
from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    role: Optional[str] = "VIEWER"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
