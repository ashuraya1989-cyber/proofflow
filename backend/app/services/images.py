from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps
from starlette.concurrency import run_in_threadpool

from backend.app.core.config import Settings
from backend.app.services.storage import original_path, thumb_path
from backend.app.utils.files import ensure_parent, guess_extension


@dataclass(frozen=True)
class StoredImage:
    image_id: str
    album_id: str
    subfolder_id: str
    filename: str
    original_ext: str
    original_path: str
    thumb_path: str
    width: int
    height: int
    created_at: datetime


async def store_upload_as_image(
    *,
    upload: UploadFile,
    image_id: str,
    album_id: str,
    subfolder_id: str,
    settings: Settings,
) -> StoredImage:
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only image uploads are supported")

    ext = guess_extension(upload.filename or "")
    orig = original_path(settings, image_id, ext)
    thm = thumb_path(settings, image_id)
    ensure_parent(orig)
    ensure_parent(thm)

    await _write_upload_to_path(upload, orig)
    width, height = await _generate_thumbnail(orig, thm)

    return StoredImage(
        image_id=image_id,
        album_id=album_id,
        subfolder_id=subfolder_id,
        filename=upload.filename or f"{image_id}{ext or ''}",
        original_ext=ext,
        original_path=str(orig),
        thumb_path=str(thm),
        width=width,
        height=height,
        created_at=datetime.now(timezone.utc),
    )


async def _write_upload_to_path(upload: UploadFile, dest: Path) -> None:
    try:
        with dest.open("wb") as f:
            while True:
                chunk = await upload.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
    finally:
        await upload.close()


def _thumbnail_worker(original: Path, thumb: Path) -> tuple[int, int]:
    with Image.open(original) as img_raw:
        img = ImageOps.exif_transpose(img_raw)
        width, height = img.size
        thumb_img = img.copy()
        thumb_img.thumbnail((512, 512), Image.Resampling.LANCZOS)
        if thumb_img.mode not in ("RGB", "L"):
            thumb_img = thumb_img.convert("RGB")
        elif thumb_img.mode == "L":
            thumb_img = thumb_img.convert("RGB")
        thumb_img.save(thumb, format="JPEG", quality=86, optimize=True, progressive=True)
        return width, height


async def _generate_thumbnail(original: Path, thumb: Path) -> tuple[int, int]:
    try:
        return await run_in_threadpool(_thumbnail_worker, original, thumb)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image file") from e
