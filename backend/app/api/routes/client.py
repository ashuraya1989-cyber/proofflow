"""Client gallery routes (public, password-protected)."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps import get_share_service, get_image_service, get_album_service, verify_client_token
from app.models.share import ShareValidation, ShareAccessResponse, ClientShareInfo
from app.models.image import ImageResponse
from app.services.share_service import ShareService
from app.services.image_service import ImageService
from app.services.album_service import AlbumService

router = APIRouter()


@router.get("/share/{token}", response_model=ClientShareInfo)
async def get_share_info(
    token: str,
    share_service: ShareService = Depends(get_share_service)
):
    """Get public share info (before password entry)."""
    info = await share_service.get_client_share_info(token)
    if not info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found or expired"
        )
    return info


@router.post("/share/{token}/access", response_model=ShareAccessResponse)
async def access_share(
    token: str,
    validation: ShareValidation,
    share_service: ShareService = Depends(get_share_service)
):
    """Validate password and get access token for gallery."""
    success, share, error = await share_service.validate_share_access(token, validation.password)
    
    if not success:
        return ShareAccessResponse(
            valid=False,
            error=error
        )
    
    # Get album info
    album = await share_service.db.albums.find_one({"_id": share["album_id"]})
    
    # Create access token
    access_token = share_service.create_client_access_token(share)
    
    return ShareAccessResponse(
        valid=True,
        album_name=album["name"] if album else "Gallery",
        custom_message=share.get("custom_message"),
        access_token=access_token
    )


@router.get("/gallery/{token}/images", response_model=List[ImageResponse])
async def get_gallery_images(
    token: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    share_service: ShareService = Depends(get_share_service),
    image_service: ImageService = Depends(get_image_service),
    album_service: AlbumService = Depends(get_album_service),
    client: dict = Depends(verify_client_token)
):
    """Get images for a gallery share. Requires client access token."""
    # Get share
    share = await share_service.get_share_by_token(token)
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )
    
    # Verify client token matches this share
    if client.get("share_id") != share["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access token does not match this share"
        )
    
    album_id = share["album_id"]
    
    if share.get("include_subfolders", True):
        # Get all descendant album IDs
        album_ids = await album_service.get_all_descendant_ids(album_id)
        images = await image_service.get_images_by_albums(album_ids, skip, limit)
    else:
        images = await image_service.get_images_by_album(album_id, skip, limit)
    
    return [image_service.to_response(img) for img in images]


@router.get("/gallery/{token}/count")
async def get_gallery_image_count(
    token: str,
    share_service: ShareService = Depends(get_share_service),
    image_service: ImageService = Depends(get_image_service),
    album_service: AlbumService = Depends(get_album_service),
    client: dict = Depends(verify_client_token)
):
    """Get total image count for a gallery share."""
    # Get share
    share = await share_service.get_share_by_token(token)
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )
    
    # Verify client token matches this share
    if client.get("share_id") != share["_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access token does not match this share"
        )
    
    album_id = share["album_id"]
    
    if share.get("include_subfolders", True):
        album_ids = await album_service.get_all_descendant_ids(album_id)
        count = await image_service.count_images_in_albums(album_ids)
    else:
        count = await image_service.count_images_in_albums([album_id])
    
    return {"count": count}
