import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    application_url = Column(String, nullable=False)
    status = Column(String, default="ACTIVE", nullable=False)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Relationships
    environments = relationship("Environment", back_populates="project", cascade="all, delete-orphan")
    explorations = relationship("Exploration", back_populates="project", cascade="all, delete-orphan")

