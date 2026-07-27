from typing import Optional, Dict, Any
from pydantic import BaseModel, HttpUrl
from uuid import UUID

class EnvironmentBase(BaseModel):
    name: str
    base_url: HttpUrl
    auth_username: Optional[str] = None
    auth_password: Optional[str] = None # Plain password input, will be encrypted
    additional_headers: Optional[Dict[str, Any]] = None
    env_variables: Optional[Dict[str, Any]] = None

class EnvironmentCreate(EnvironmentBase):
    project_id: UUID

class EnvironmentUpdate(BaseModel):
    name: Optional[str] = None
    base_url: Optional[HttpUrl] = None
    auth_username: Optional[str] = None
    auth_password: Optional[str] = None
    additional_headers: Optional[Dict[str, Any]] = None
    env_variables: Optional[Dict[str, Any]] = None

class EnvironmentResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    base_url: HttpUrl
    auth_username: Optional[str] = None
    additional_headers: Optional[Dict[str, Any]] = None
    env_variables: Optional[Dict[str, Any]] = None
    # Never return auth_password_encrypted in the API

    class Config:
        from_attributes = True
