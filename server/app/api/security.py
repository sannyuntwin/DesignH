from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/")
async def get_security_info(current_user: dict = Depends(get_current_user)):
    """Get security dashboard information."""
    return {
        "active_sessions": 0,
        "recent_logins": [],
        "security_settings": {}
    }
