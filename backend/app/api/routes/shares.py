"""Share management routes for admin."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_share_service, get_album_service, verify_admin_token
from app.models.share import ShareCreate, ShareResponse
from app.services.share_service import ShareService
from app.services.album_service import AlbumService

router = APIRouter()


@router.post("", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
async def create_share(
    share_data: ShareCreate,
    share_service: ShareService = Depends(get_share_service),
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Create a new share link for an album."""
    # Verify album exists
    album = await album_service.get_album(share_data.album_id)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    
    share = await share_service.create_share(share_data)
    return await share_service.to_response(share)


@router.get("", response_model=List[ShareResponse])
async def list_shares(
    album_id: str = None,
    share_service: ShareService = Depends(get_share_service),
    _: dict = Depends(verify_admin_token)
):
    """List all shares, optionally filtered by album."""
    if album_id:
        shares = await share_service.get_shares_by_album(album_id)
    else:
        shares = await share_service.get_all_shares()
    
    return [await share_service.to_response(s) for s in shares]


@router.get("/{share_id}", response_model=ShareResponse)
async def get_share(
    share_id: str,
    share_service: ShareService = Depends(get_share_service),
    _: dict = Depends(verify_admin_token)
):
    """Get a single share by ID."""
    share = await share_service.get_share(share_id)
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )
    return await share_service.to_response(share)


@router.post("/{share_id}/deactivate", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_share(
    share_id: str,
    share_service: ShareService = Depends(get_share_service),
    _: dict = Depends(verify_admin_token)
):
    """Deactivate a share link (can be reactivated later)."""
    success = await share_service.deactivate_share(share_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )


@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_share(
    share_id: str,
    share_service: ShareService = Depends(get_share_service),
    _: dict = Depends(verify_admin_token)
):
    """Permanently delete a share link."""
    success = await share_service.delete_share(share_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )
