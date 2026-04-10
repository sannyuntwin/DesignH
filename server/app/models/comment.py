from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base
import uuid

class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    design_id = Column(UUID(as_uuid=True), ForeignKey("designs.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    content = Column(Text, nullable=False)
    x_coordinate = Column(Numeric(10, 2), nullable=True)
    y_coordinate = Column(Numeric(10, 2), nullable=True)
    parent_id = Column(UUID(as_uuid=True), nullable=True)  # for threaded comments
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    design = relationship("Design", back_populates="comments")
