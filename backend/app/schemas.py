from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field, constr


class AlbumCreate(BaseModel):
    name: constr(min_length=1, max_length=120)


class AlbumOut(BaseModel):
    id: str
    name: str
    created_at: datetime


class ImageUrls(BaseModel):
    thumb: str
    display: str
    original: str


class ImageOut(BaseModel):
    id: str
    album_id: str
    folder: str
    filename: str
    width: int
    height: int
    size: int
    content_type: str
    urls: ImageUrls
    created_at: datetime


class UploadResult(BaseModel):
    filename: str
    status: str
    image: ImageOut | None = None
    error: str | None = None


class ShareCreate(BaseModel):
    album_id: str
    folder: str | None = Field(default=None)
    password: str | None = Field(default=None, max_length=128)


class ShareOut(BaseModel):
    id: str
    token: str
    url: str
    requires_password: bool
    album_id: str
    folder: str | None
    created_at: datetime


class ShareAccess(BaseModel):
    password: str | None = Field(default=None, max_length=128)
