from fastapi import APIRouter, Depends, UploadFile, File
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile."""
    return {"profile": {}}

@router.put("/")
async def update_profile(current_user: dict = Depends(get_current_user)):
    """Update user profile."""
    return {"message": "Profile updated successfully", "profile": {}}

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Upload user avatar."""
    return {"message": "Avatar uploaded successfully", "avatar_url": ""}
