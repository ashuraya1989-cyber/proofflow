"""Authentication routes."""
from datetime import timedelta
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings
from app.core.security import validate_admin_credentials, create_access_token

router = APIRouter()


class LoginRequest(BaseModel):
    """Admin login request."""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Admin login response."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthStatus(BaseModel):
    """Authentication status response."""
    authenticated: bool
    username: str | None = None


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Admin login endpoint."""
    if not validate_admin_credentials(request.username, request.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": request.username, "type": "admin"},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return LoginResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/status", response_model=AuthStatus)
async def auth_status():
    """Check if authentication is configured (public endpoint)."""
    return AuthStatus(
        authenticated=False,
        username=None
    )
