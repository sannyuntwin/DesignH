from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base
import uuid

class Version(Base):
    __tablename__ = "design_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    design_id = Column(UUID(as_uuid=True), ForeignKey("designs.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    canvas_data = Column(JSONB, nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=False)
    change_description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    design = relationship("Design", back_populates="versions")
