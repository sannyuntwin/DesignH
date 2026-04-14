import asyncio
import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.core.config import settings
from app.core.security import get_password_hash

logger = logging.getLogger(__name__)

async def seed_admin_user(db: AsyncSession):
    """
    Seeds a default admin user if the database is empty.
    """
    try:
        # Check if any users exist
        result = await db.execute(select(User).limit(1))
        any_user = result.scalar_one_or_none()

        if not any_user:
            admin_email = getattr(settings, "DEFAULT_ADMIN_EMAIL", "admin@example.com")
            admin_password = getattr(settings, "DEFAULT_ADMIN_PASSWORD", "admin123")
            
            logger.info(f"Seeding default admin user: {admin_email}")
            
            new_admin = User(
                email=admin_email,
                name="System Administrator",
                password_hash=get_password_hash(admin_password),
                is_active=True,
                is_admin=True
            )
            
            db.add(new_admin)
            await db.commit()
            logger.info("Admin user seeded successfully.")
        else:
            logger.debug("Database not empty, skipping admin seeding.")
            
    except Exception as e:
        logger.error(f"Error during admin seeding: {e}")
        await db.rollback()
