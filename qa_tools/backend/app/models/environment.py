import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base

class Environment(Base):
    __tablename__ = "environments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False) # e.g. Development, Staging, Production
    base_url = Column(String, nullable=False)
    auth_username = Column(String, nullable=True)
    auth_password_encrypted = Column(String, nullable=True)
    additional_headers = Column(JSONB, nullable=True)
    env_variables = Column(JSONB, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="environments")
    explorations = relationship("Exploration", back_populates="environment", cascade="all, delete-orphan")
