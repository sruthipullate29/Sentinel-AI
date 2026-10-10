import os
from dotenv import load_dotenv

# Try to load .env from the root directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
# Also try backend directory just in case
# Force IPv4 for urllib3 to prevent ConnectionResetError (10054) to Google FCM on Windows
try:
    import socket
    import urllib3.util.connection as urllib_conn
    urllib_conn.allowed_gai_family = lambda: socket.AF_INET
except Exception:
    pass

import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router
from services.memory_service import memory_service
from monitoring.telemetry_engine import telemetry_engine
from database import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Vision404 Backend",
    description="AI-powered incident response agent with Hindsight episodic memory",
    version="2.0.0",
)

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
    # 1. Initialise database (creates tables if not present — safe to re-run)
    db.init_db()
    logger.info("Database initialised")

    # 2. Start live telemetry collection
    telemetry_engine.start()
    logger.info("Telemetry engine started")

    # 3. Retry any pending Hindsight outbox items from previous runs
    result = await memory_service.retry_pending_outbox()
    if result["total"] > 0:
        logger.info(f"Startup outbox retry: {result}")

    logger.info("Vision404 backend ready")


@app.on_event("shutdown")
async def shutdown_event():
    telemetry_engine.stop()
    logger.info("Vision404 backend stopped")


@app.get("/healthz")
async def health_check():
    hindsight_status = await memory_service.health_check()
    return {
        "status": "healthy",
        "hindsight": hindsight_status,
        "pending_outbox": len(db.get_pending_outbox_items()),
    }
