from __future__ import annotations

import asyncio
import mimetypes
import os
import shutil
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from PIL import Image, ImageOps

DISPLAY_MAX = 2400
THUMB_MAX = 480


def _guess_extension(filename: str | None, content_type: str | None) -> str:
    if filename:
        ext = Path(filename).suffix.lower()
        if ext:
            return ext
    if content_type:
        ext = mimetypes.guess_extension(content_type)
        if ext:
            return ext
    return ".jpg"


def _has_alpha(img: Image.Image) -> bool:
    return img.mode in ("RGBA", "LA") or (
        img.mode == "P" and "transparency" in img.info
    )


def _write_original(upload: UploadFile, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    upload.file.seek(0)
    with destination.open("wb") as buffer:
        shutil.copyfileobj(upload.file, buffer)


def _build_variants(original_path: Path, dest_dir: Path) -> dict:
    with Image.open(original_path) as image:
        image = ImageOps.exif_transpose(image)
        width, height = image.size
        alpha = _has_alpha(image)

        display = image.copy()
        display.thumbnail((DISPLAY_MAX, DISPLAY_MAX), Image.LANCZOS)
        thumb = image.copy()
        thumb.thumbnail((THUMB_MAX, THUMB_MAX), Image.LANCZOS)

        if alpha:
            fmt = "PNG"
            ext = "png"
            media_type = "image/png"
            display = display.convert("RGBA")
            thumb = thumb.convert("RGBA")
        else:
            fmt = "JPEG"
            ext = "jpg"
            media_type = "image/jpeg"
            display = display.convert("RGB")
            thumb = thumb.convert("RGB")

        display_path = dest_dir / f"display.{ext}"
        thumb_path = dest_dir / f"thumb.{ext}"
        display.save(display_path, format=fmt, quality=92, optimize=True)
        thumb.save(thumb_path, format=fmt, quality=84, optimize=True)

    return {
        "width": width,
        "height": height,
        "display_path": display_path,
        "thumb_path": thumb_path,
        "variant_content_type": media_type,
        "display_width": display.size[0],
        "display_height": display.size[1],
        "thumb_width": thumb.size[0],
        "thumb_height": thumb.size[1],
    }


async def save_upload(
    upload: UploadFile,
    storage_root: Path,
    image_id: str,
) -> dict:
    if not upload.content_type or not upload.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{upload.filename or 'File'} is not a supported image.",
        )

    ext = _guess_extension(upload.filename, upload.content_type)
    image_dir = storage_root / image_id
    original_path = image_dir / f"original{ext}"

    await asyncio.to_thread(_write_original, upload, original_path)

    try:
        variant_data = await asyncio.to_thread(
            _build_variants, original_path, image_dir
        )
    except Exception as exc:  # pragma: no cover - invalid image
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{upload.filename or 'File'} is not a valid image.",
        ) from exc

    size = os.path.getsize(original_path)
    return {
        "original_path": original_path,
        "display_path": variant_data["display_path"],
        "thumb_path": variant_data["thumb_path"],
        "width": variant_data["width"],
        "height": variant_data["height"],
        "display_width": variant_data["display_width"],
        "display_height": variant_data["display_height"],
        "thumb_width": variant_data["thumb_width"],
        "thumb_height": variant_data["thumb_height"],
        "size": size,
        "variant_content_type": variant_data["variant_content_type"],
    }
