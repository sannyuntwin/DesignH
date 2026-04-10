from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/")
async def get_files(current_user: dict = Depends(get_current_user)):
    """Get all files."""
    return {"files": []}

@router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload a new file."""
    return {"message": "File uploaded successfully", "file": {"filename": file.filename}}
