from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/{design_id}")
async def get_collaborators(design_id: UUID, current_user: dict = Depends(get_current_user)):
    """Get all collaborators for a design."""
    return {"collaborators": []}

@router.put("/{design_id}/{user_id}")
async def update_collaborator(
    design_id: UUID, 
    user_id: UUID, 
    current_user: dict = Depends(get_current_user)
):
    """Update collaborator permissions."""
    return {"message": "Collaborator updated successfully"}

@router.delete("/{design_id}/{user_id}")
async def remove_collaborator(
    design_id: UUID, 
    user_id: UUID, 
    current_user: dict = Depends(get_current_user)
):
    """Remove a collaborator."""
    return {"message": "Collaborator removed successfully"}
