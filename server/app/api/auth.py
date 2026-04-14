from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.base import get_db
from app.models.user import User
from app.schemas.auth import UserLogin, UserRegister, UserResponse, TokenResponse, GoogleAuthRequest
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.core.logging import record_audit_log
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from datetime import datetime

router = APIRouter()


def should_be_admin(email: str | None) -> bool:
    if not email:
        return False
    return email.lower() in settings.admin_emails_set()


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user and return JWT token."""
    try:
        # Find user by email
        result = await db.execute(select(User).where(User.email == login_data.email))
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        if not user.password_hash:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="This account uses Google sign-in"
            )

        # Check password
        if not verify_password(login_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )

        if should_be_admin(user.email) and not bool(user.is_admin):
            user.is_admin = True

        # Generate JWT token
        token = create_access_token(
            data={"userId": str(user.id), "email": user.email, "isAdmin": bool(user.is_admin)}
        )

        # Update last login
        user.last_login = datetime.utcnow()
        await record_audit_log(db, "USER_LOGIN", user=user, target="System Access")
        await db.commit()
        await db.refresh(user)

        # Return user data without password
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_admin=bool(user.is_admin),
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login
        )

        return TokenResponse(
            message="Login successful",
            token=token,
            user=user_response
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}" if settings.DEBUG else "Internal server error"
        )


@router.post("/register", response_model=TokenResponse)
async def register(register_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    try:
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == register_data.email))
        existing_user = result.scalar_one_or_none()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Hash password
        hashed_password = get_password_hash(register_data.password)

        # Create new user
        new_user = User(
            email=register_data.email,
            name=register_data.name,
            password_hash=hashed_password,
            is_admin=should_be_admin(register_data.email),
        )

        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        # Generate JWT token
        token = create_access_token(
            data={"userId": str(new_user.id), "email": new_user.email, "isAdmin": bool(new_user.is_admin)}
        )

        user_response = UserResponse(
            id=new_user.id,
            email=new_user.email,
            name=new_user.name,
            is_admin=bool(new_user.is_admin),
            created_at=new_user.created_at,
            updated_at=new_user.updated_at,
            last_login=new_user.last_login
        )

        return TokenResponse(
            message="Registration successful",
            token=token,
            user=user_response
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}" if settings.DEBUG else "Internal server error"
        )


@router.post("/google", response_model=TokenResponse)
async def google_login(google_data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Login or register user via Google ID token."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google sign-in is not configured"
        )

    try:
        token_info = id_token.verify_oauth2_token(
            google_data.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )

    email = token_info.get("email")
    name = token_info.get("name")

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token does not contain an email"
        )

    try:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                email=email,
                name=name or email.split("@")[0],
                password_hash=None,
                is_admin=should_be_admin(email),
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        else:
            if name and (not user.name):
                user.name = name
            if should_be_admin(user.email) and not bool(user.is_admin):
                user.is_admin = True
            user.last_login = datetime.utcnow()
            await db.commit()
            await db.refresh(user)

        token = create_access_token(
            data={"userId": str(user.id), "email": user.email, "isAdmin": bool(user.is_admin)}
        )

        user_response = UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_admin=bool(user.is_admin),
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login
        )

        return TokenResponse(
            message="Google login successful",
            token=token,
            user=user_response
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}" if settings.DEBUG else "Internal server error"
        )
