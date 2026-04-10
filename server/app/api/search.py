from fastapi import APIRouter, Depends, Query
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/")
async def search(q: str = Query(...), current_user: dict = Depends(get_current_user)):
    """Search designs and templates."""
    return {"results": []}
