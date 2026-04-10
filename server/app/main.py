from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, designs, teams, templates, assets, files, analytics, search, security, profile, comments, versions, export, collaborators
from app import models  # ensure all SQLAlchemy models are registered

app = FastAPI(
    title="Design Editor API",
    description="Backend API for Design Editor application",
    version="1.0.0"
)

# CORS middleware to allow requests from Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(designs.router, prefix="/api/designs", tags=["designs"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(assets.router, prefix="/api/assets", tags=["assets"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(security.router, prefix="/api/security", tags=["security"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(versions.router, prefix="/api/versions", tags=["versions"])
app.include_router(export.router, prefix="/api/export", tags=["export"])
app.include_router(collaborators.router, prefix="/api/collaborators", tags=["collaborators"])

@app.get("/")
async def root():
    return {"message": "Design Editor API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
