import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base


class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exploration_id = Column(UUID(as_uuid=True), ForeignKey("explorations.id", ondelete="CASCADE"), nullable=False)
    page_id = Column(UUID(as_uuid=True), ForeignKey("pages.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    priority = Column(String, default="MEDIUM", nullable=False)  # HIGH, MEDIUM, LOW
    test_type = Column(String, default="FUNCTIONAL", nullable=False)  # FUNCTIONAL, UI, ACCESSIBILITY, SECURITY
    steps = Column(JSONB, nullable=True)  # List of step strings
    expected_result = Column(String, nullable=True)
    status = Column(String, default="DRAFT", nullable=False)  # DRAFT, APPROVED, REJECTED
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    exploration = relationship("Exploration", back_populates="test_cases")
    page = relationship("Page", back_populates="test_cases")
