from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
from app.models.user import User
import logging

logger = logging.getLogger(__name__)

async def record_audit_log(
    db: AsyncSession,
    action: str,
    user: Optional[User] = None,
    user_id: Optional[Any] = None,
    user_email: Optional[str] = None,
    status: str = "success",
    target: Optional[str] = None,
    details: Optional[dict[str, Any]] = None
):
    """
    Record an administrative or significant user action in the database.
    Does not commit by itself, expects the caller to commit.
    """
    try:
        final_user_id = user.id if user else user_id
        final_user_email = user.email if user else user_email
        
        log_entry = AuditLog(
            user_id=final_user_id,
            user_email=final_user_email or "system",
            action=action,
            status=status,
            target=target,
            details=details
        )
        db.add(log_entry)
    except Exception as e:
        logger.error(f"Failed to record audit log: {e}")
