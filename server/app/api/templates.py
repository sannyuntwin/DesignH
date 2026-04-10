from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import get_db
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/")
async def get_templates(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get all templates."""
    return {"templates": []}

@router.post("/")
async def create_template():
    """Create a new template."""
    return {"message": "Template created successfully", "template": {}}

@router.get("/{template_id}")
async def get_template(template_id: str):
    """Get a specific template."""
    return {"template": {}}

@router.put("/{template_id}")
async def update_template(template_id: str):
    """Update a template."""
    return {"message": "Template updated successfully", "template": {}}

@router.delete("/{template_id}")
async def delete_template(template_id: str):
    """Delete a template."""
    return {"message": "Template deleted successfully"}
