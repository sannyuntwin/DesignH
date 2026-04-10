from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/")
async def get_analytics(current_user: dict = Depends(get_current_user)):
    """Get analytics data."""
    return {
        "views": 0,
        "downloads": 0,
        "shares": 0,
        "designs_created": 0
    }
