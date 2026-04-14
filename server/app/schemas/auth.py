from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class GoogleAuthRequest(BaseModel):
    id_token: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: Optional[str]
    is_admin: bool = False
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    last_login: Optional[datetime]

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    message: str
    token: str
    user: UserResponse
