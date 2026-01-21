from fastapi import APIRouter

from app.api.routes import albums, images, shares

api_router = APIRouter()
api_router.include_router(albums.router, prefix="/albums", tags=["albums"])
api_router.include_router(images.router, prefix="/images", tags=["images"])
api_router.include_router(shares.router, prefix="/shares", tags=["shares"])
