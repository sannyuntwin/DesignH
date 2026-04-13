from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, String, cast
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone
from app.models.base import get_db
from app.models.design import Design
from app.models.user import User
from app.schemas.design import DesignCreate, DesignUpdate, DesignResponse, DesignListResponse
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=DesignListResponse)
async def get_designs(
    filter: Optional[str] = Query("all"),
    search: Optional[str] = Query(""),
    page: Optional[int] = Query(1),
    limit: Optional[int] = Query(20),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all designs for the current user with filters and search."""
    try:
        safe_page = max(1, int(page or 1))
        safe_limit = max(1, min(200, int(limit or 20)))
        offset = (safe_page - 1) * safe_limit

        # Base query
        query = (
            select(Design, User.name.label("user_name"))
            .join(User, Design.user_id == User.id, isouter=True)
            .where(Design.user_id == current_user["user_id"])
        )
        
        # Apply filters
        if filter == "recent":
            cutoff = datetime.now(timezone.utc) - timedelta(days=7)
            query = query.where(Design.updated_at >= cutoff)
        elif filter == "templates":
            query = query.where(Design.is_template.is_(True))
        elif filter == "shared":
            query = query.where(Design.is_public.is_(True))
        
        # Apply search
        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.where(
                or_(
                    Design.name.ilike(search_pattern),
                    cast(Design.tags, String).ilike(search_pattern),
                )
            )

        query = query.order_by(Design.updated_at.desc()).offset(offset).limit(safe_limit)
        
        result = await db.execute(query)
        designs = result.all()
        
        design_list = []
        for design_row in designs:
            design = design_row[0]
            design_list.append(DesignResponse(
                id=design.id,
                name=design.name,
                description=design.description,
                canvas_data=design.canvas_data,
                user_id=design.user_id,
                user_name=design_row[1],
                thumbnail=design.thumbnail,
                width=design.width,
                height=design.height,
                is_template=design.is_template,
                is_public=design.is_public,
                tags=design.tags or [],
                collaborators_count=0,
                views_count=0,
                created_at=design.created_at,
                updated_at=design.updated_at
            ))
        
        return DesignListResponse(designs=design_list)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch designs"
        )

@router.post("/", response_model=DesignResponse, status_code=status.HTTP_201_CREATED)
async def create_design(
    design_data: DesignCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new design."""
    try:
        # Create new design
        new_design = Design(
            name=design_data.name,
            description=design_data.description,
            canvas_data=design_data.canvas_data,
            user_id=current_user["user_id"],
            width=design_data.width,
            height=design_data.height
        )
        
        db.add(new_design)
        await db.commit()
        await db.refresh(new_design)
        
        # If created from template, copy template data
        if design_data.template_id:
            template_result = await db.execute(
                select(Design).where(
                    Design.id == design_data.template_id,
                    Design.is_template == True
                )
            )
            template = template_result.scalar_one_or_none()
            
            if template:
                new_design.canvas_data = template.canvas_data
                await db.commit()
                await db.refresh(new_design)
        
        # Get user name
        user_result = await db.execute(select(User).where(User.id == new_design.user_id))
        user = user_result.scalar_one_or_none()
        
        return DesignResponse(
            id=new_design.id,
            name=new_design.name,
            description=new_design.description,
            canvas_data=new_design.canvas_data,
            user_id=new_design.user_id,
            user_name=user.name if user else None,
            thumbnail=new_design.thumbnail,
            width=new_design.width,
            height=new_design.height,
            is_template=new_design.is_template,
            is_public=new_design.is_public,
            tags=new_design.tags or [],
            created_at=new_design.created_at,
            updated_at=new_design.updated_at
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create design"
        )

@router.get("/{design_id}", response_model=DesignResponse)
async def get_design(
    design_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific design by ID."""
    try:
        result = await db.execute(
            select(Design, User.name.label("user_name"))
            .join(User, Design.user_id == User.id, isouter=True)
            .where(
                Design.id == design_id,
                Design.user_id == current_user["user_id"]
            )
        )
        design_row = result.first()
        
        if not design_row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Design not found"
            )
        
        design = design_row[0]
        
        return DesignResponse(
            id=design.id,
            name=design.name,
            description=design.description,
            canvas_data=design.canvas_data,
            user_id=design.user_id,
            user_name=design_row[1],
            thumbnail=design.thumbnail,
            width=design.width,
            height=design.height,
            is_template=design.is_template,
            is_public=design.is_public,
            tags=design.tags or [],
            created_at=design.created_at,
            updated_at=design.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch design"
        )

@router.put("/{design_id}", response_model=DesignResponse)
async def update_design(
    design_id: UUID,
    design_data: DesignUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a design."""
    try:
        result = await db.execute(
            select(Design).where(
                Design.id == design_id,
                Design.user_id == current_user["user_id"]
            )
        )
        design = result.scalar_one_or_none()
        
        if not design:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Design not found"
            )
        
        # Update fields
        update_data = design_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(design, field, value)
        
        await db.commit()
        await db.refresh(design)
        
        # Get user name
        user_result = await db.execute(select(User).where(User.id == design.user_id))
        user = user_result.scalar_one_or_none()
        
        return DesignResponse(
            id=design.id,
            name=design.name,
            description=design.description,
            canvas_data=design.canvas_data,
            user_id=design.user_id,
            user_name=user.name if user else None,
            thumbnail=design.thumbnail,
            width=design.width,
            height=design.height,
            is_template=design.is_template,
            is_public=design.is_public,
            tags=design.tags or [],
            created_at=design.created_at,
            updated_at=design.updated_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update design"
        )

@router.delete("/{design_id}", status_code=status.HTTP_200_OK)
async def delete_design(
    design_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a design."""
    try:
        result = await db.execute(
            select(Design).where(
                Design.id == design_id,
                Design.user_id == current_user["user_id"]
            )
        )
        design = result.scalar_one_or_none()
        
        if not design:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Design not found"
            )
        
        await db.delete(design)
        await db.commit()
        
        return {"message": "Design deleted successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete design"
        )
