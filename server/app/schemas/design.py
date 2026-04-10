from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

class DesignCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    canvas_data: Optional[Dict[str, Any]] = {"elements": [], "version": "1.0"}
    width: Optional[int] = 800
    height: Optional[int] = 600
    template_id: Optional[UUID] = None

class DesignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    canvas_data: Optional[Dict[str, Any]] = None
    thumbnail: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    is_public: Optional[bool] = None
    tags: Optional[List[str]] = None

class DesignResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    canvas_data: Optional[Dict[str, Any]]
    user_id: UUID
    user_name: Optional[str] = None
    thumbnail: Optional[str]
    width: int
    height: int
    is_template: bool
    is_public: bool
    tags: Optional[List[str]] = []
    collaborators_count: Optional[int] = 0
    views_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DesignListResponse(BaseModel):
    designs: List[DesignResponse]
