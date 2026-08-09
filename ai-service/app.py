from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.planner import router as planner_router
import os

app = FastAPI(
    title="VoyAgent AI Service",
    description="AI Backend for VoyAgent",
    version="1.0.0",
)

configured_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://localhost:5000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    planner_router,
    prefix="/planner",
    tags=["Planner"],
)

@app.get("/health")
def health():
    return {
        "status": "ok",
    }

@app.get("/")
def home():
    return {
        "success": True,
        "message": "VoyAgent AI Service is Running 🚀",
    }
