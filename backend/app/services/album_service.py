"""Album service for business logic operations."""
from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.album import AlbumCreate, AlbumUpdate, AlbumResponse, AlbumTree
from app.core.config import settings


class AlbumService:
    """Service for album operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.albums
    
    async def create_album(self, album_data: AlbumCreate) -> dict:
        """Create a new album."""
        album_doc = {
            "name": album_data.name,
            "description": album_data.description,
            "parent_id": album_data.parent_id,
            "image_count": 0,
            "cover_image_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        
        result = await self.collection.insert_one(album_doc)
        album_doc["_id"] = str(result.inserted_id)
        return album_doc
    
    async def get_album(self, album_id: str) -> Optional[dict]:
        """Get a single album by ID."""
        if not ObjectId.is_valid(album_id):
            return None
        
        album = await self.collection.find_one({"_id": ObjectId(album_id)})
        if album:
            album["_id"] = str(album["_id"])
            if album.get("parent_id"):
                album["parent_id"] = str(album["parent_id"])
        return album
    
    async def get_all_albums(self, parent_id: Optional[str] = None) -> List[dict]:
        """Get all albums, optionally filtered by parent."""
        query = {}
        if parent_id:
            query["parent_id"] = parent_id
        else:
            query["parent_id"] = None  # Top-level albums only
        
        cursor = self.collection.find(query).sort("name", 1)
        albums = []
        async for album in cursor:
            album["_id"] = str(album["_id"])
            if album.get("parent_id"):
                album["parent_id"] = str(album["parent_id"])
            albums.append(album)
        return albums
    
    async def get_album_tree(self) -> List[AlbumTree]:
        """Get hierarchical album tree for navigation."""
        # Fetch all albums
        all_albums = []
        async for album in self.collection.find().sort("name", 1):
            album["_id"] = str(album["_id"])
            if album.get("parent_id"):
                album["parent_id"] = str(album["parent_id"])
            all_albums.append(album)
        
        # Build tree structure
        albums_by_id = {a["_id"]: a for a in all_albums}
        root_albums = []
        
        for album in all_albums:
            album["children"] = []
        
        for album in all_albums:
            parent_id = album.get("parent_id")
            if parent_id and parent_id in albums_by_id:
                albums_by_id[parent_id]["children"].append(album)
            else:
                root_albums.append(album)
        
        def to_tree(album: dict) -> AlbumTree:
            return AlbumTree(
                id=album["_id"],
                name=album["name"],
                image_count=album.get("image_count", 0),
                children=[to_tree(c) for c in album.get("children", [])]
            )
        
        return [to_tree(a) for a in root_albums]
    
    async def get_subfolders(self, album_id: str) -> List[dict]:
        """Get all subfolders of an album."""
        cursor = self.collection.find({"parent_id": album_id}).sort("name", 1)
        subfolders = []
        async for album in cursor:
            album["_id"] = str(album["_id"])
            subfolders.append(album)
        return subfolders
    
    async def get_all_descendant_ids(self, album_id: str) -> List[str]:
        """Get IDs of all albums including descendants (for 'All' view)."""
        result = [album_id]
        subfolders = await self.get_subfolders(album_id)
        
        for subfolder in subfolders:
            descendant_ids = await self.get_all_descendant_ids(subfolder["_id"])
            result.extend(descendant_ids)
        
        return result
    
    async def update_album(self, album_id: str, album_data: AlbumUpdate) -> Optional[dict]:
        """Update an album."""
        if not ObjectId.is_valid(album_id):
            return None
        
        update_data = album_data.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(album_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result["_id"] = str(result["_id"])
        return result
    
    async def delete_album(self, album_id: str) -> bool:
        """Delete an album and its subfolders."""
        if not ObjectId.is_valid(album_id):
            return False
        
        # Get all descendant album IDs
        all_ids = await self.get_all_descendant_ids(album_id)
        
        # Delete all images in these albums
        for aid in all_ids:
            await self.db.images.delete_many({"album_id": aid})
        
        # Delete all shares for these albums
        for aid in all_ids:
            await self.db.shares.delete_many({"album_id": aid})
        
        # Delete all albums
        for aid in all_ids:
            await self.collection.delete_one({"_id": ObjectId(aid)})
        
        return True
    
    async def update_image_count(self, album_id: str, delta: int = 1):
        """Update the image count for an album."""
        if not ObjectId.is_valid(album_id):
            return
        
        await self.collection.update_one(
            {"_id": ObjectId(album_id)},
            {
                "$inc": {"image_count": delta},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
    
    async def set_cover_image(self, album_id: str, image_id: Optional[str]):
        """Set or clear the cover image for an album."""
        if not ObjectId.is_valid(album_id):
            return
        
        await self.collection.update_one(
            {"_id": ObjectId(album_id)},
            {
                "$set": {
                    "cover_image_id": image_id,
                    "updated_at": datetime.utcnow()
                }
            }
        )
    
    async def to_response(self, album: dict) -> AlbumResponse:
        """Convert album document to response model."""
        cover_url = None
        if album.get("cover_image_id"):
            cover_url = f"{settings.BASE_URL}/api/images/{album['cover_image_id']}/thumbnail"
        
        subfolders = await self.get_subfolders(album["_id"])
        subfolder_responses = [await self.to_response(s) for s in subfolders]
        
        return AlbumResponse(
            id=album["_id"],
            name=album["name"],
            description=album.get("description"),
            parent_id=album.get("parent_id"),
            image_count=album.get("image_count", 0),
            cover_image_url=cover_url,
            created_at=album["created_at"],
            updated_at=album["updated_at"],
            subfolders=subfolder_responses
        )
