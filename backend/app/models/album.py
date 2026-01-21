"""Album model definitions."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(str):
    """Custom ObjectId type for Pydantic."""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")


class AlbumBase(BaseModel):
    """Base album model."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class AlbumCreate(AlbumBase):
    """Album creation model."""
    parent_id: Optional[str] = Field(None, description="Parent album ID for subfolders")


class AlbumUpdate(BaseModel):
    """Album update model."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)


class Album(AlbumBase):
    """Full album model with database fields."""
    id: str = Field(..., alias="_id")
    parent_id: Optional[str] = None
    image_count: int = 0
    cover_image_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}


class AlbumResponse(BaseModel):
    """Album API response model."""
    id: str
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None
    image_count: int = 0
    cover_image_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    subfolders: List["AlbumResponse"] = []
    
    class Config:
        from_attributes = True


class AlbumTree(BaseModel):
    """Album tree structure for navigation."""
    id: str
    name: str
    image_count: int = 0
    children: List["AlbumTree"] = []


# Update forward references
AlbumResponse.model_rebuild()
AlbumTree.model_rebuild()
