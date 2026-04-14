from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.models.base import get_db
from app.models.audit_log import AuditLog
from app.models.design import Design
from app.models.template import Template
from app.models.user import User
from app.core.logging import record_audit_log

router = APIRouter()


async def get_current_admin(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    user_id_raw = current_user.get("user_id")
    try:
        user_id = UUID(str(user_id_raw))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user session")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    configured_admin = bool(user.email and user.email.lower() in settings.admin_emails_set())
    if configured_admin and not bool(user.is_admin):
        user.is_admin = True
        await db.commit()
        await db.refresh(user)

    if not bool(user.is_admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    return user


@router.get("/overview")
async def admin_overview(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_designs = (await db.execute(select(func.count(Design.id)))).scalar() or 0
    total_templates = (await db.execute(select(func.count(Template.id)))).scalar() or 0
    total_admins = (await db.execute(select(func.count(User.id)).where(User.is_admin.is_(True)))).scalar() or 0

    recent_users_rows = await db.execute(
        select(User).order_by(desc(User.created_at)).limit(8)
    )
    recent_users = [
        {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "is_admin": bool(user.is_admin),
            "created_at": user.created_at.isoformat() if isinstance(user.created_at, datetime) else None,
            "last_login": user.last_login.isoformat() if isinstance(user.last_login, datetime) else None,
        }
        for user in recent_users_rows.scalars().all()
    ]

    recent_design_rows = await db.execute(
        select(Design, User.email)
        .join(User, Design.user_id == User.id, isouter=True)
        .order_by(desc(Design.updated_at))
        .limit(8)
    )
    recent_designs = [
        {
            "id": str(design.id),
            "name": design.name,
            "owner_email": owner_email,
            "width": design.width,
            "height": design.height,
            "updated_at": design.updated_at.isoformat() if isinstance(design.updated_at, datetime) else None,
        }
        for design, owner_email in recent_design_rows.all()
    ]

    return {
        "stats": {
            "users": int(total_users),
            "designs": int(total_designs),
            "templates": int(total_templates),
            "admins": int(total_admins),
        },
        "recent_users": recent_users,
        "recent_designs": recent_designs,
    }


@router.get("/users")
async def admin_users(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    rows = await db.execute(select(User).order_by(desc(User.created_at)).limit(limit))
    users = rows.scalars().all()
    return {
        "users": [
            {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "is_admin": bool(user.is_admin),
                "created_at": user.created_at.isoformat() if isinstance(user.created_at, datetime) else None,
                "last_login": user.last_login.isoformat() if isinstance(user.last_login, datetime) else None,
            }
            for user in users
        ]
    }


@router.get("/designs")
async def admin_designs(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    rows = await db.execute(
        select(Design, User.email)
        .join(User, Design.user_id == User.id, isouter=True)
        .order_by(desc(Design.updated_at))
        .limit(limit)
    )
    designs = [
        {
            "id": str(design.id),
            "name": design.name,
            "owner_email": owner_email,
            "width": design.width,
            "height": design.height,
            "is_template": bool(design.is_template),
            "is_public": bool(design.is_public),
            "updated_at": design.updated_at.isoformat() if isinstance(design.updated_at, datetime) else None,
        }
        for design, owner_email in rows.all()
    ]
    return {"designs": designs}


@router.get("/templates")
async def admin_templates(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    rows = await db.execute(
        select(Template).order_by(desc(Template.created_at)).limit(limit)
    )
    templates = [
        {
            "id": str(template.id),
            "name": template.name,
            "category": template.category,
            "width": template.width,
            "height": template.height,
            "created_at": template.created_at.isoformat() if isinstance(template.created_at, datetime) else None,
        }
        for template in rows.scalars().all()
    ]
    return {"templates": templates}


@router.get("/logs")
async def admin_logs(
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    rows = await db.execute(
        select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit)
    )
    logs = [
        {
            "id": str(log.id),
            "time": log.created_at.isoformat() if log.created_at else None,
            "user": log.user_email,
            "action": log.action,
            "status": log.status,
            "target": log.target,
            "details": log.details,
        }
        for log in rows.scalars().all()
    ]
    return {"logs": logs}


@router.get("/settings")
async def admin_settings(
    _admin: User = Depends(get_current_admin),
):
    return {
        "settings": {
            "admin_emails": settings.ADMIN_EMAILS,
            "debug_mode": settings.DEBUG,
            "app_name": settings.APP_NAME,
            "cors_origins": settings.CORS_ORIGINS,
        }
    }


@router.post("/settings")
async def update_admin_settings(
    new_settings: dict,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    # This is a placeholder for real settings persistence
    await record_audit_log(
        db, 
        "SETTINGS_UPDATE", 
        user=admin, 
        target="System Configuration",
        details=new_settings
    )
    await db.commit()
    return {"message": "Settings updated and logged"}
