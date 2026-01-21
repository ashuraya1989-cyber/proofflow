"""Image model definitions."""
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class ImageResolution(str, Enum):
    """Image resolution types for serving."""
    THUMBNAIL = "thumbnail"  # 400x400 - for grid views
    MEDIUM = "medium"        # 1200x1200 - for preview
    ORIGINAL = "original"    # Full resolution - for download/client view


class ImageBase(BaseModel):
    """Base image model."""
    filename: str
    original_filename: str
    mime_type: str
    file_size: int


class ImageCreate(BaseModel):
    """Image creation model (internal use)."""
    album_id: str
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    width: int
    height: int


class Image(ImageBase):
    """Full image model with database fields."""
    id: str = Field(..., alias="_id")
    album_id: str
    width: int
    height: int
    has_thumbnail: bool = True
    has_medium: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


class ImageResponse(BaseModel):
    """Image API response model."""
    id: str
    album_id: str
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    width: int
    height: int
    thumbnail_url: str
    medium_url: str
    original_url: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ImageUploadResponse(BaseModel):
    """Response for image upload."""
    id: str
    filename: str
    original_filename: str
    success: bool = True
    message: str = "Upload successful"


class BulkUploadProgress(BaseModel):
    """Bulk upload progress tracking."""
    total: int
    completed: int
    failed: int
    current_file: Optional[str] = None
    errors: list[str] = []
