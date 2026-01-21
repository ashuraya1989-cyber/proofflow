from fastapi import APIRouter, HTTPException, Body, Depends
from typing import List
from app.models import AlbumModel
from app.schemas import AlbumCreate, AlbumResponse
from app.database import db
from bson import ObjectId

router = APIRouter()

@router.post("/", response_model=AlbumResponse)
async def create_album(album: AlbumCreate):
    new_album = AlbumModel(**album.model_dump())
    result = await db.db.albums.insert_one(new_album.model_dump(by_alias=True))
    created_album = await db.db.albums.find_one({"_id": result.inserted_id})
    
    return AlbumResponse(
        id=str(created_album["_id"]),
        name=created_album["name"],
        description=created_album.get("description"),
        parent_id=created_album.get("parent_id"),
        created_at=created_album["created_at"]
    )

@router.get("/", response_model=List[AlbumResponse])
async def list_albums():
    albums = await db.db.albums.find().to_list(1000)
    response = []
    for album in albums:
        # Count images in album
        count = await db.db.images.count_documents({"album_id": str(album["_id"])})
        
        # Get cover image if exists, or first image
        cover_url = None
        if album.get("cover_image_id"):
            # TODO: logic to get cover image URL
            pass
        else:
            first_image = await db.db.images.find_one({"album_id": str(album["_id"])})
            if first_image:
                 # Assuming endpoint structure
                 cover_url = f"/api/images/serve/{first_image['path_thumbnail']}" 

        response.append(AlbumResponse(
            id=str(album["_id"]),
            name=album["name"],
            description=album.get("description"),
            parent_id=album.get("parent_id"),
            created_at=album["created_at"],
            image_count=count,
            cover_image_url=cover_url
        ))
    return response

@router.get("/{album_id}", response_model=AlbumResponse)
async def get_album(album_id: str):
    if not ObjectId.is_valid(album_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    
    album = await db.db.albums.find_one({"_id": ObjectId(album_id)})
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    
    count = await db.db.images.count_documents({"album_id": str(album["_id"])})
    
    return AlbumResponse(
        id=str(album["_id"]),
        name=album["name"],
        description=album.get("description"),
        parent_id=album.get("parent_id"),
        created_at=album["created_at"],
        image_count=count
    )
