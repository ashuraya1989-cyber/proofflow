from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status

from app.db import db
from app.schemas import AlbumCreate, AlbumOut
from app.utils.ids import serialize_id, to_object_id

router = APIRouter()


@router.get("", response_model=list[AlbumOut])
async def list_albums() -> list[AlbumOut]:
    albums = []
    cursor = db["albums"].find().sort("created_at", -1)
    async for album in cursor:
        albums.append(serialize_id(album))
    return albums


@router.post("", response_model=AlbumOut, status_code=status.HTTP_201_CREATED)
async def create_album(payload: AlbumCreate) -> AlbumOut:
    now = datetime.now(timezone.utc)
    doc = {"name": payload.name.strip(), "created_at": now}
    if not doc["name"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Album name is required."
        )
    try:
        result = await db["albums"].insert_one(doc)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Album name already exists.",
        ) from exc
    doc["_id"] = result.inserted_id
    return serialize_id(doc)


@router.get("/{album_id}")
async def get_album(album_id: str) -> dict:
    album = await db["albums"].find_one({"_id": to_object_id(album_id)})
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")
    folders = await db["images"].distinct("folder", {"album_id": album["_id"]})
    folders = sorted([folder for folder in folders if folder])
    album = serialize_id(album)
    return {"album": album, "folders": folders}
