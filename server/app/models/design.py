from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import Base
import uuid

class Design(Base):
    __tablename__ = "designs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    canvas_data = Column(JSONB, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    thumbnail = Column(String, nullable=True)
    width = Column(Integer, default=800)
    height = Column(Integer, default=600)
    is_template = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)
    tags = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", backref="designs")
    collaborations = relationship("Collaboration", back_populates="design", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="design", cascade="all, delete-orphan")
    versions = relationship("Version", back_populates="design", cascade="all, delete-orphan")
