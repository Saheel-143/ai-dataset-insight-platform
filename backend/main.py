"""
Main FastAPI Application & AWS Lambda Mangum Adapter
AI Dataset Insight Platform Backend
"""
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.handlers.auth_handler import router as auth_router
from backend.handlers.datasets_handler import router as datasets_router, seed_samples
from backend.handlers.analysis_handler import router as analysis_router
from backend.handlers.cleaning_handler import router as cleaning_router
from backend.handlers.visualization_handler import router as viz_router
from backend.handlers.chatbot_handler import router as chatbot_router
from backend.handlers.report_handler import router as report_router
from backend.services.database_service import db_service
from backend.models.schemas import UserProfile

app = FastAPI(
    title="AI Dataset Insight Platform API",
    description="Deterministic natural language dataset question-answering and intelligence engine.",
    version="1.0.0"
)

# Enable CORS for local Vite dev server and production CloudFront/S3 origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router)
app.include_router(datasets_router)
app.include_router(analysis_router)
app.include_router(cleaning_router)
app.include_router(viz_router)
app.include_router(chatbot_router)
app.include_router(report_router)

@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "service": "AI Dataset Insight Platform",
        "storage_mode": os.environ.get("STORAGE_MODE", "local"),
        "db_mode": os.environ.get("DB_MODE", "local"),
        "auth_mode": os.environ.get("AUTH_MODE", "local")
    }

@app.on_event("startup")
def on_startup():
    """Ensure demo user has sample datasets seeded on first startup"""
    try:
        demo_user = UserProfile(
            id="usr-demo-001",
            email="demo@example.com",
            name="Demo Analyst",
            created_at="",
            role="admin"
        )
        existing = db_service.list_user_datasets(demo_user.id)
        if not existing:
            print("[Startup] Seeding 5 initial sample datasets for demo analyst...", flush=True)
            seed_samples(user=demo_user)
            print("[Startup] Sample datasets seeded successfully.", flush=True)
    except Exception as e:
        print(f"[Startup] Note on sample seeding: {e}", flush=True)

# AWS Lambda Handler entrypoint (lazy loaded to prevent blocking on Python 3.14)
def handler(event, context):
    from mangum import Mangum
    asgi_handler = Mangum(app, lifespan="off")
    return asgi_handler(event, context)

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
