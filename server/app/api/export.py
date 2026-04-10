from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/{design_id}/{format}")
async def export_design(design_id: UUID, format: str, current_user: dict = Depends(get_current_user)):
    """Export a design in specified format."""
    return {"message": f"Export to {format} started", "job_id": ""}

@router.get("/{job_id}")
async def get_export_status(job_id: str, current_user: dict = Depends(get_current_user)):
    """Get export job status."""
    return {"status": "completed", "file_url": ""}
