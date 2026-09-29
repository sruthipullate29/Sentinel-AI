from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from services.memory_service import memory_service
from monitoring.telemetry_engine import telemetry_engine

app = FastAPI(title="SentinelAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    # Initialize telemetry monitoring loop in background if needed
    telemetry_engine.start()

@app.on_event("shutdown")
async def shutdown_event():
    telemetry_engine.stop()

@app.get("/healthz")
async def health_check():
    hindsight_status = await memory_service.health_check()
    return {
        "status": "healthy",
        "hindsight": hindsight_status
    }
