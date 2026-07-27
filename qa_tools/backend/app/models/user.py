import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="VIEWER", nullable=False) # ADMIN, QA_MANAGER, QA_ENGINEER, VIEWER
    created_at = Column(DateTime, default=func.now(), nullable=False)
