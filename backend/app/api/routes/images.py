"""Image management routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from fastapi.responses import FileResponse

from app.api.deps import get_image_service, get_album_service, verify_admin_token, verify_any_token
from app.models.image import ImageResponse, ImageResolution, ImageUploadResponse
from app.services.image_service import ImageService
from app.services.album_service import AlbumService
from app.core.config import settings

router = APIRouter()


@router.post("/upload/{album_id}", response_model=ImageUploadResponse)
async def upload_image(
    album_id: str,
    file: UploadFile = File(...),
    image_service: ImageService = Depends(get_image_service),
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Upload a single image to an album."""
    # Verify album exists
    album = await album_service.get_album(album_id)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    
    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No filename provided"
        )
    
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {settings.ALLOWED_EXTENSIONS}"
        )
    
    # Read file content
    content = await file.read()
    
    # Validate file size
    if len(content) > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE // 1024 // 1024}MB"
        )
    
    # Process and save image
    try:
        image = await image_service.process_and_save_image(
            file_content=content,
            original_filename=file.filename,
            album_id=album_id,
            mime_type=file.content_type or "image/jpeg"
        )
        
        return ImageUploadResponse(
            id=image["_id"],
            filename=image["filename"],
            original_filename=image["original_filename"],
            success=True,
            message="Upload successful"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process image: {str(e)}"
        )


@router.post("/upload/{album_id}/bulk", response_model=List[ImageUploadResponse])
async def upload_images_bulk(
    album_id: str,
    files: List[UploadFile] = File(...),
    image_service: ImageService = Depends(get_image_service),
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Upload multiple images to an album."""
    # Verify album exists
    album = await album_service.get_album(album_id)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    
    results = []
    
    for file in files:
        try:
            # Validate file type
            if not file.filename:
                results.append(ImageUploadResponse(
                    id="",
                    filename="",
                    original_filename="unknown",
                    success=False,
                    message="No filename provided"
                ))
                continue
            
            ext = file.filename.rsplit(".", 1)[-1].lower()
            if ext not in settings.ALLOWED_EXTENSIONS:
                results.append(ImageUploadResponse(
                    id="",
                    filename="",
                    original_filename=file.filename,
                    success=False,
                    message=f"File type not allowed"
                ))
                continue
            
            # Read file content
            content = await file.read()
            
            # Validate file size
            if len(content) > settings.MAX_UPLOAD_SIZE:
                results.append(ImageUploadResponse(
                    id="",
                    filename="",
                    original_filename=file.filename,
                    success=False,
                    message="File too large"
                ))
                continue
            
            # Process and save image
            image = await image_service.process_and_save_image(
                file_content=content,
                original_filename=file.filename,
                album_id=album_id,
                mime_type=file.content_type or "image/jpeg"
            )
            
            results.append(ImageUploadResponse(
                id=image["_id"],
                filename=image["filename"],
                original_filename=image["original_filename"],
                success=True,
                message="Upload successful"
            ))
            
        except Exception as e:
            results.append(ImageUploadResponse(
                id="",
                filename="",
                original_filename=file.filename if file.filename else "unknown",
                success=False,
                message=str(e)
            ))
    
    return results


@router.get("/album/{album_id}", response_model=List[ImageResponse])
async def list_album_images(
    album_id: str,
    include_subfolders: bool = Query(False, description="Include images from subfolders"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    image_service: ImageService = Depends(get_image_service),
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """List images in an album."""
    # Verify album exists
    album = await album_service.get_album(album_id)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    
    if include_subfolders:
        # Get all descendant album IDs
        album_ids = await album_service.get_all_descendant_ids(album_id)
        images = await image_service.get_images_by_albums(album_ids, skip, limit)
    else:
        images = await image_service.get_images_by_album(album_id, skip, limit)
    
    return [image_service.to_response(img) for img in images]


@router.get("/{image_id}", response_model=ImageResponse)
async def get_image(
    image_id: str,
    image_service: ImageService = Depends(get_image_service),
    _: dict = Depends(verify_admin_token)
):
    """Get image metadata."""
    image = await image_service.get_image(image_id)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    return image_service.to_response(image)


@router.get("/{image_id}/thumbnail")
async def get_image_thumbnail(
    image_id: str,
    image_service: ImageService = Depends(get_image_service),
    token: dict = Depends(verify_any_token)
):
    """Get image thumbnail (400x400). Requires authentication."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    result = await image_service.get_image_file(image_id, ImageResolution.THUMBNAIL)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    file_path, mime_type = result
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        headers={"Cache-Control": "public, max-age=31536000"}
    )


@router.get("/{image_id}/medium")
async def get_image_medium(
    image_id: str,
    image_service: ImageService = Depends(get_image_service),
    token: dict = Depends(verify_any_token)
):
    """Get image at medium resolution (1200x1200). Requires authentication."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    result = await image_service.get_image_file(image_id, ImageResolution.MEDIUM)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    file_path, mime_type = result
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        headers={"Cache-Control": "public, max-age=31536000"}
    )


@router.get("/{image_id}/original")
async def get_image_original(
    image_id: str,
    image_service: ImageService = Depends(get_image_service),
    token: dict = Depends(verify_any_token)
):
    """Get original image at full resolution. Requires authentication."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    result = await image_service.get_image_file(image_id, ImageResolution.ORIGINAL)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    file_path, mime_type = result
    
    # Get image info for download filename
    image = await image_service.get_image(image_id)
    download_name = image["original_filename"] if image else "image"
    
    return FileResponse(
        path=file_path,
        media_type=mime_type,
        filename=download_name,
        headers={"Cache-Control": "public, max-age=31536000"}
    )


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(
    image_id: str,
    image_service: ImageService = Depends(get_image_service),
    _: dict = Depends(verify_admin_token)
):
    """Delete an image."""
    success = await image_service.delete_image(image_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )


@router.post("/{image_id}/set-cover", status_code=status.HTTP_204_NO_CONTENT)
async def set_album_cover(
    image_id: str,
    image_service: ImageService = Depends(get_image_service),
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Set image as album cover."""
    image = await image_service.get_image(image_id)
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found"
        )
    
    await album_service.set_cover_image(image["album_id"], image_id)
