"""
ProofFlow Backend API
A FastAPI application for the ProofFlow service.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="ProofFlow API",
    description="Backend API for ProofFlow application",
    version="1.0.0",
)

# Configure CORS - use environment variable for allowed origins
# Default to localhost for development; set ALLOWED_ORIGINS env var for production
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint returning API status."""
    return {"status": "ok", "message": "ProofFlow API is running"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
