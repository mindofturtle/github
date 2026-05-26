import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv

load_dotenv()

from database import engine
import models

# Create all tables
models.Base.metadata.create_all(bind=engine)

from routers import users, sleep, workouts, nutrition, supplements, heart, goals, recovery, dashboard, ai

app = FastAPI(
    title="PeakForm — AI Fitness Tracker",
    description="Full-body performance optimization with AI-powered peak window prediction",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(sleep.router)
app.include_router(workouts.router)
app.include_router(nutrition.router)
app.include_router(supplements.router)
app.include_router(heart.router)
app.include_router(goals.router)
app.include_router(recovery.router)
app.include_router(dashboard.router)
app.include_router(ai.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "PeakForm"}


# Serve frontend build if it exists
frontend_dist = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=f"{frontend_dist}/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        index = os.path.join(frontend_dist, "index.html")
        return FileResponse(index)
