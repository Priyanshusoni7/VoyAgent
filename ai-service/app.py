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

# GET and HEAD, because uptime monitors commonly probe with HEAD and FastAPI
# does not add it for you (a GET-only route answers HEAD with 405).
#
# Deliberately does no work: no LangGraph run, no Gemini call, no SerpAPI call.
# It only reports that the process is serving, so it stays free to poll and
# keeps the free-tier instance from spinning down between trips.
@app.api_route("/health", methods=["GET", "HEAD"])
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
