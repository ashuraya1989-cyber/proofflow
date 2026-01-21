"""Share/client link model definitions."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ShareBase(BaseModel):
    """Base share model."""
    album_id: str
    include_subfolders: bool = True


class ShareCreate(BaseModel):
    """Share creation model."""
    album_id: str
    password: str = Field(..., min_length=4, max_length=100)
    include_subfolders: bool = True
    expires_in_days: Optional[int] = Field(None, ge=1, le=365)
    custom_message: Optional[str] = Field(None, max_length=500)


class Share(ShareBase):
    """Full share model with database fields."""
    id: str = Field(..., alias="_id")
    token: str  # Unique URL token
    password_hash: str
    custom_message: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True
    view_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True


class ShareResponse(BaseModel):
    """Share API response model (for admin)."""
    id: str
    album_id: str
    album_name: str
    token: str
    share_url: str  # Absolute URL
    include_subfolders: bool
    custom_message: Optional[str] = None
    expires_at: Optional[datetime] = None
    is_active: bool
    view_count: int
    created_at: datetime
    last_accessed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ShareValidation(BaseModel):
    """Share password validation request."""
    password: str


class ShareAccessResponse(BaseModel):
    """Response when client accesses a share."""
    valid: bool
    album_name: Optional[str] = None
    custom_message: Optional[str] = None
    access_token: Optional[str] = None  # Temporary token for image access
    error: Optional[str] = None


class ClientShareInfo(BaseModel):
    """Public share info for client gallery."""
    album_name: str
    custom_message: Optional[str] = None
    image_count: int
    requires_password: bool = True
