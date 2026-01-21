from __future__ import annotations

from datetime import datetime, timezone
import secrets

from fastapi import APIRouter, HTTPException, Request, status

from app.config import get_settings
from app.db import db
from app.schemas import ShareAccess, ShareCreate, ShareOut
from app.utils.http import public_base_url
from app.utils.ids import serialize_id, to_object_id
from app.utils.security import hash_password, verify_password

router = APIRouter()


def _image_urls(request: Request, image_id: str) -> dict:
    base = public_base_url(request)
    return {
        "thumb": f"{base}/api/images/{image_id}/file?variant=thumb",
        "display": f"{base}/api/images/{image_id}/file?variant=display",
        "original": f"{base}/api/images/{image_id}/file?variant=original",
    }


def _share_url(request: Request, token: str) -> str:
    settings = get_settings()
    base = settings.base_public_url or public_base_url(request)
    return f"{base}/share/{token}"


@router.post("", response_model=ShareOut, status_code=status.HTTP_201_CREATED)
async def create_share(request: Request, payload: ShareCreate) -> ShareOut:
    album = await db["albums"].find_one({"_id": to_object_id(payload.album_id)})
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    folder = payload.folder.strip() if payload.folder else None
    if folder and folder.lower() == "all":
        folder = None

    token = secrets.token_urlsafe(16)
    now = datetime.now(timezone.utc)
    hashed_password = hash_password(payload.password) if payload.password else None

    doc = {
        "album_id": album["_id"],
        "folder": folder,
        "token": token,
        "password": hashed_password,
        "created_at": now,
    }
    result = await db["shares"].insert_one(doc)
    doc["_id"] = result.inserted_id
    share = serialize_id(doc)
    return {
        "id": share["id"],
        "token": token,
        "url": _share_url(request, token),
        "requires_password": bool(hashed_password),
        "album_id": str(doc["album_id"]),
        "folder": folder,
        "created_at": now,
    }


@router.get("/{token}")
async def get_share(request: Request, token: str) -> dict:
    share = await db["shares"].find_one({"token": token})
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    album = await db["albums"].find_one({"_id": share["album_id"]})
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    response = {
        "share": {
            "token": token,
            "album_id": str(share["album_id"]),
            "folder": share.get("folder"),
            "requires_password": bool(share.get("password")),
            "url": _share_url(request, token),
            "created_at": share["created_at"],
        },
        "album": serialize_id(album),
    }

    if share.get("password"):
        return response

    images = []
    query = {"album_id": share["album_id"]}
    if share.get("folder"):
        query["folder"] = share["folder"]
    cursor = db["images"].find(query).sort("created_at", -1)
    async for image in cursor:
        image = serialize_id(image)
        image["album_id"] = str(image["album_id"])
        image["urls"] = _image_urls(request, image["id"])
        images.append(image)
    response["images"] = images
    return response


@router.post("/{token}/access")
async def access_share(request: Request, token: str, payload: ShareAccess) -> dict:
    share = await db["shares"].find_one({"token": token})
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    if share.get("password"):
        if not payload.password or not verify_password(payload.password, share["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password."
            )

    album = await db["albums"].find_one({"_id": share["album_id"]})
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    images = []
    query = {"album_id": share["album_id"]}
    if share.get("folder"):
        query["folder"] = share["folder"]
    cursor = db["images"].find(query).sort("created_at", -1)
    async for image in cursor:
        image = serialize_id(image)
        image["album_id"] = str(image["album_id"])
        image["urls"] = _image_urls(request, image["id"])
        images.append(image)

    return {
        "share": {
            "token": token,
            "album_id": str(share["album_id"]),
            "folder": share.get("folder"),
            "requires_password": bool(share.get("password")),
            "url": _share_url(request, token),
            "created_at": share["created_at"],
        },
        "album": serialize_id(album),
        "images": images,
    }
