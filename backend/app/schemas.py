from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

# Image Schemas
class ImageBase(BaseModel):
    filename: str
    album_id: str

class ImageCreate(ImageBase):
    pass

class ImageResponse(ImageBase):
    id: str
    original_filename: str
    width: Optional[int]
    height: Optional[int]
    upload_date: datetime
    url_original: str
    url_thumbnail: str
    url_display: str

    class Config:
        from_attributes = True

# Album Schemas
class AlbumBase(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[str] = None

class AlbumCreate(AlbumBase):
    pass

class AlbumResponse(AlbumBase):
    id: str
    created_at: datetime
    cover_image_url: Optional[str] = None
    image_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Share Schemas
class ShareBase(BaseModel):
    album_id: str
    password: Optional[str] = None
    expires_at: Optional[datetime] = None

class ShareCreate(ShareBase):
    pass

class ShareResponse(BaseModel):
    id: str
    album_id: str
    share_link: str
    is_protected: bool
    created_at: datetime
    expires_at: Optional[datetime]

    class Config:
        from_attributes = True

class ShareAccess(BaseModel):
    password: str
