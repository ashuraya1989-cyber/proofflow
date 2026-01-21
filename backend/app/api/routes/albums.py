"""Album management routes."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_album_service, verify_admin_token
from app.models.album import AlbumCreate, AlbumUpdate, AlbumResponse, AlbumTree
from app.services.album_service import AlbumService

router = APIRouter()


@router.post("", response_model=AlbumResponse, status_code=status.HTTP_201_CREATED)
async def create_album(
    album_data: AlbumCreate,
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Create a new album."""
    # Verify parent exists if specified
    if album_data.parent_id:
        parent = await album_service.get_album(album_data.parent_id)
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent album not found"
            )
    
    album = await album_service.create_album(album_data)
    return await album_service.to_response(album)


@router.get("", response_model=List[AlbumResponse])
async def list_albums(
    parent_id: str = None,
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """List all albums, optionally filtered by parent."""
    albums = await album_service.get_all_albums(parent_id)
    return [await album_service.to_response(a) for a in albums]


@router.get("/tree", response_model=List[AlbumTree])
async def get_album_tree(
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Get hierarchical album tree for navigation."""
    return await album_service.get_album_tree()


@router.get("/{album_id}", response_model=AlbumResponse)
async def get_album(
    album_id: str,
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Get a single album by ID."""
    album = await album_service.get_album(album_id)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    return await album_service.to_response(album)


@router.patch("/{album_id}", response_model=AlbumResponse)
async def update_album(
    album_id: str,
    album_data: AlbumUpdate,
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Update an album."""
    album = await album_service.update_album(album_id, album_data)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    return await album_service.to_response(album)


@router.delete("/{album_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_album(
    album_id: str,
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Delete an album and all its contents."""
    success = await album_service.delete_album(album_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )


@router.get("/{album_id}/subfolders", response_model=List[AlbumResponse])
async def get_subfolders(
    album_id: str,
    album_service: AlbumService = Depends(get_album_service),
    _: dict = Depends(verify_admin_token)
):
    """Get all subfolders of an album."""
    # Verify album exists
    album = await album_service.get_album(album_id)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Album not found"
        )
    
    subfolders = await album_service.get_subfolders(album_id)
    return [await album_service.to_response(s) for s in subfolders]
