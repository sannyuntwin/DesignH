from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth
from app import models  # ensure all SQLAlchemy models are registered
from app.core.config import settings
from app.models.base import initialize_schema

app = FastAPI(
    title="Design Editor API",
    description="Backend API for Design Editor application",
    version="1.0.0"
)

# CORS middleware to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])


@app.on_event("startup")
async def ensure_schema():
    """Create missing tables/columns for environments without migrations (e.g., fresh Render DB)."""
    await initialize_schema()

@app.get("/")
async def root():
    return {"message": "Design Editor API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
