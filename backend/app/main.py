from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import get_settings
from app.db import close_db, connect_db


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Gallery API", version="1.0.0")

    origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins else ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    async def startup() -> None:
        Path(settings.storage_path).mkdir(parents=True, exist_ok=True)
        await connect_db()

    @app.on_event("shutdown")
    async def shutdown() -> None:
        await close_db()

    @app.get("/api/health")
    async def health() -> dict:
        return {"status": "ok"}

    app.include_router(api_router, prefix="/api")
    return app


app = create_app()
