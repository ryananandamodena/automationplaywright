import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base

class Exploration(Base):
    __tablename__ = "explorations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    environment_id = Column(UUID(as_uuid=True), ForeignKey("environments.id"), nullable=False)
    status = Column(String, default="PENDING", nullable=False) # PENDING, RUNNING, COMPLETED, FAILED
    progress = Column(Integer, default=0, nullable=False)
    discovered_modules = Column(JSONB, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="explorations")
    environment = relationship("Environment", back_populates="explorations")
    pages = relationship("Page", back_populates="exploration", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="exploration", cascade="all, delete-orphan")

