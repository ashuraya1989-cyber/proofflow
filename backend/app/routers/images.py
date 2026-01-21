from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from typing import List
from app.models import ImageModel
from app.schemas import ImageResponse
from app.database import db
from app.services.image_processing import process_image
from app.config import settings
from bson import ObjectId
import os
from fastapi.responses import FileResponse

router = APIRouter()

@router.post("/upload", response_model=ImageResponse)
async def upload_image(
    file: UploadFile = File(...),
    album_id: str = Form(...),
):
    # Verify album exists
    if not ObjectId.is_valid(album_id):
        raise HTTPException(status_code=400, detail="Invalid Album ID")
        
    album = await db.db.albums.find_one({"_id": ObjectId(album_id)})
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")

    contents = await file.read()
    
    # Process image
    try:
        processed = process_image(contents, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Save to DB
    new_image = ImageModel(
        filename=file.filename,
        original_filename=file.filename,
        content_type=file.content_type,
        size=len(contents),
        width=processed["width"],
        height=processed["height"],
        album_id=album_id,
        path_original=processed["path_original"],
        path_thumbnail=processed["path_thumbnail"],
        path_display=processed["path_display"]
    )
    
    result = await db.db.images.insert_one(new_image.model_dump(by_alias=True))
    
    return ImageResponse(
        id=str(result.inserted_id),
        filename=new_image.filename,
        original_filename=new_image.original_filename,
        width=new_image.width,
        height=new_image.height,
        upload_date=new_image.upload_date,
        album_id=new_image.album_id,
        url_original=f"/api/images/serve/{new_image.path_original}",
        url_thumbnail=f"/api/images/serve/{new_image.path_thumbnail}",
        url_display=f"/api/images/serve/{new_image.path_display}"
    )

@router.get("/album/{album_id}", response_model=List[ImageResponse])
async def get_album_images(album_id: str):
    images = await db.db.images.find({"album_id": album_id}).to_list(1000)
    return [
        ImageResponse(
            id=str(img["_id"]),
            filename=img["filename"],
            original_filename=img["original_filename"],
            width=img.get("width"),
            height=img.get("height"),
            upload_date=img["upload_date"],
            album_id=img["album_id"],
            url_original=f"/api/images/serve/{img['path_original']}",
            url_thumbnail=f"/api/images/serve/{img['path_thumbnail']}",
            url_display=f"/api/images/serve/{img['path_display']}"
        ) for img in images
    ]

@router.get("/serve/{file_path:path}")
async def serve_image(file_path: str):
    # Security check: ensure path is within uploads directory
    # simplistic check to prevent traversal
    if ".." in file_path:
        raise HTTPException(status_code=400, detail="Invalid path")
        
    full_path = os.path.join(settings.UPLOAD_DIR, file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(full_path)
