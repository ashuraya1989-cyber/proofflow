"""API dependencies for dependency injection."""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.database import get_database
from app.core.security import decode_access_token
from app.services.album_service import AlbumService
from app.services.image_service import ImageService
from app.services.share_service import ShareService

security = HTTPBearer()
optional_security = HTTPBearer(auto_error=False)


async def get_album_service() -> AlbumService:
    """Get album service instance."""
    db = get_database()
    return AlbumService(db)


async def get_image_service() -> ImageService:
    """Get image service instance."""
    db = get_database()
    return ImageService(db)


async def get_share_service() -> ShareService:
    """Get share service instance."""
    db = get_database()
    return ShareService(db)


async def verify_admin_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Verify admin JWT token."""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if payload.get("type") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    
    return payload


async def verify_client_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """Verify client access token."""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if payload.get("type") != "client_access":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client access required",
        )
    
    return payload


async def verify_any_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)
) -> Optional[dict]:
    """Verify any valid token (admin or client), returns None if no token."""
    if not credentials:
        return None
    
    token = credentials.credentials
    payload = decode_access_token(token)
    return payload
