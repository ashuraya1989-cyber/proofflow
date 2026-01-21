from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from bson import ObjectId

from app.config import get_settings
from app.db import db
from app.schemas import ImageOut, UploadResult
from app.services.storage import save_upload
from app.utils.http import public_base_url
from app.utils.ids import serialize_id, to_object_id

router = APIRouter()


def _normalize_folder(value: str | None) -> str:
    if value is None:
        return "General"
    cleaned = value.strip()
    if not cleaned or cleaned.lower() == "all":
        return "General"
    return cleaned


def _image_urls(request: Request, image_id: str) -> dict:
    base = public_base_url(request)
    return {
        "thumb": f"{base}/api/images/{image_id}/file?variant=thumb",
        "display": f"{base}/api/images/{image_id}/file?variant=display",
        "original": f"{base}/api/images/{image_id}/file?variant=original",
    }


@router.get("", response_model=list[ImageOut])
async def list_images(
    request: Request,
    album_id: str,
    folder: str | None = None,
) -> list[ImageOut]:
    album = await db["albums"].find_one({"_id": to_object_id(album_id)})
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    query = {"album_id": album["_id"]}
    if folder and folder.lower() != "all":
        query["folder"] = folder

    images = []
    cursor = db["images"].find(query).sort("created_at", -1)
    async for image in cursor:
        image = serialize_id(image)
        image["album_id"] = str(image["album_id"])
        image["urls"] = _image_urls(request, image["id"])
        images.append(image)
    return images


@router.post("/upload", response_model=list[UploadResult])
async def upload_images(
    request: Request,
    album_id: str = Form(...),
    folder: str | None = Form(default=None),
    files: list[UploadFile] = File(...),
) -> list[UploadResult]:
    album = await db["albums"].find_one({"_id": to_object_id(album_id)})
    if not album:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    storage_root = Path(get_settings().storage_path)
    folder_value = _normalize_folder(folder)
    results: list[UploadResult] = []

    for upload in files:
        try:
            image_object_id = ObjectId()
            image_id = str(image_object_id)
            save_result = await save_upload(upload, storage_root, image_id)
            doc = {
                "_id": image_object_id,
                "album_id": album["_id"],
                "folder": folder_value,
                "filename": upload.filename or "image",
                "width": save_result["width"],
                "height": save_result["height"],
                "size": save_result["size"],
                "content_type": upload.content_type,
                "variant_content_type": save_result["variant_content_type"],
                "paths": {
                    "original": str(
                        save_result["original_path"].relative_to(storage_root)
                    ),
                    "display": str(
                        save_result["display_path"].relative_to(storage_root)
                    ),
                    "thumb": str(save_result["thumb_path"].relative_to(storage_root)),
                },
                "created_at": datetime.now(timezone.utc),
            }
            await db["images"].replace_one({"_id": doc["_id"]}, doc, upsert=True)
            image = serialize_id(doc)
            image["album_id"] = str(image["album_id"])
            image["urls"] = _image_urls(request, image["id"])
            results.append(
                UploadResult(
                    filename=upload.filename or "image",
                    status="success",
                    image=image,
                )
            )
        except HTTPException as exc:
            results.append(
                UploadResult(
                    filename=upload.filename or "image",
                    status="error",
                    error=str(exc.detail),
                )
            )
        finally:
            await upload.close()

    return results


@router.get("/{image_id}/file")
async def get_image_file(image_id: str, variant: str = "display") -> FileResponse:
    image = await db["images"].find_one({"_id": to_object_id(image_id)})
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found.")

    variant = variant.lower()
    if variant not in {"thumb", "display", "original"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid variant."
        )

    storage_root = Path(get_settings().storage_path)
    path = storage_root / image["paths"][variant]
    if not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Missing file.")

    media_type = image["content_type"] if variant == "original" else image[
        "variant_content_type"
    ]
    return FileResponse(path, media_type=media_type, headers={"Cache-Control": "public, max-age=31536000"})
