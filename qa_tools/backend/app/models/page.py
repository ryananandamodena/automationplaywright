import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base

class Page(Base):
    __tablename__ = "pages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exploration_id = Column(UUID(as_uuid=True), ForeignKey("explorations.id"), nullable=False)
    url = Column(String, nullable=False)
    title = Column(String, nullable=True)
    page_name = Column(String, nullable=True)
    dom_snapshot = Column(JSONB, nullable=True)
    
    # Relationships
    exploration = relationship("Exploration", back_populates="pages")
    test_cases = relationship("TestCase", back_populates="page")
