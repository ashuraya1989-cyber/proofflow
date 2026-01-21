# API routes module
from fastapi import APIRouter

from app.api.routes import auth, albums, images, shares, client

api_router = APIRouter()

# Admin routes
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(albums.router, prefix="/albums", tags=["albums"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(shares.router, prefix="/shares", tags=["shares"])

# Client routes
api_router.include_router(client.router, prefix="/client", tags=["client"])
