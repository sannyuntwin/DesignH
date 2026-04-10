from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/{design_id}")
async def get_comments(design_id: UUID, current_user: dict = Depends(get_current_user)):
    """Get all comments for a design."""
    return {"comments": []}

@router.post("/{design_id}")
async def add_comment(design_id: UUID, current_user: dict = Depends(get_current_user)):
    """Add a comment to a design."""
    return {"message": "Comment added successfully", "comment": {}}

@router.put("/{comment_id}")
async def update_comment(comment_id: UUID, current_user: dict = Depends(get_current_user)):
    """Update a comment."""
    return {"message": "Comment updated successfully", "comment": {}}

@router.delete("/{comment_id}")
async def delete_comment(comment_id: UUID, current_user: dict = Depends(get_current_user)):
    """Delete a comment."""
    return {"message": "Comment deleted successfully"}
