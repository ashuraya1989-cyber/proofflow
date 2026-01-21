"""Share service for client link operations."""
from datetime import datetime, timedelta
from typing import Optional, List
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.share import ShareCreate, ShareResponse, ClientShareInfo
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, generate_share_token, create_access_token


class ShareService:
    """Service for share/client link operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.shares
    
    async def create_share(self, share_data: ShareCreate) -> dict:
        """Create a new share link."""
        # Generate unique token
        token = generate_share_token()
        
        # Calculate expiry
        expires_at = None
        if share_data.expires_in_days:
            expires_at = datetime.utcnow() + timedelta(days=share_data.expires_in_days)
        
        share_doc = {
            "album_id": share_data.album_id,
            "token": token,
            "password_hash": get_password_hash(share_data.password),
            "include_subfolders": share_data.include_subfolders,
            "custom_message": share_data.custom_message,
            "expires_at": expires_at,
            "is_active": True,
            "view_count": 0,
            "created_at": datetime.utcnow(),
            "last_accessed_at": None,
        }
        
        result = await self.collection.insert_one(share_doc)
        share_doc["_id"] = str(result.inserted_id)
        return share_doc
    
    async def get_share(self, share_id: str) -> Optional[dict]:
        """Get share by ID."""
        if not ObjectId.is_valid(share_id):
            return None
        
        share = await self.collection.find_one({"_id": ObjectId(share_id)})
        if share:
            share["_id"] = str(share["_id"])
        return share
    
    async def get_share_by_token(self, token: str) -> Optional[dict]:
        """Get share by token."""
        share = await self.collection.find_one({"token": token})
        if share:
            share["_id"] = str(share["_id"])
        return share
    
    async def get_shares_by_album(self, album_id: str) -> List[dict]:
        """Get all shares for an album."""
        cursor = self.collection.find({"album_id": album_id}).sort("created_at", -1)
        shares = []
        async for share in cursor:
            share["_id"] = str(share["_id"])
            shares.append(share)
        return shares
    
    async def get_all_shares(self) -> List[dict]:
        """Get all shares."""
        cursor = self.collection.find().sort("created_at", -1)
        shares = []
        async for share in cursor:
            share["_id"] = str(share["_id"])
            shares.append(share)
        return shares
    
    async def validate_share_access(self, token: str, password: str) -> tuple:
        """Validate share access with password.
        
        Returns (success: bool, share: dict or None, error: str or None)
        """
        share = await self.get_share_by_token(token)
        
        if not share:
            return False, None, "Share link not found"
        
        if not share.get("is_active"):
            return False, None, "Share link is no longer active"
        
        if share.get("expires_at") and share["expires_at"] < datetime.utcnow():
            return False, None, "Share link has expired"
        
        if not verify_password(password, share["password_hash"]):
            return False, None, "Invalid password"
        
        # Update access stats
        await self.collection.update_one(
            {"_id": ObjectId(share["_id"])},
            {
                "$inc": {"view_count": 1},
                "$set": {"last_accessed_at": datetime.utcnow()}
            }
        )
        
        return True, share, None
    
    async def deactivate_share(self, share_id: str) -> bool:
        """Deactivate a share link."""
        if not ObjectId.is_valid(share_id):
            return False
        
        result = await self.collection.update_one(
            {"_id": ObjectId(share_id)},
            {"$set": {"is_active": False}}
        )
        return result.modified_count > 0
    
    async def delete_share(self, share_id: str) -> bool:
        """Delete a share link."""
        if not ObjectId.is_valid(share_id):
            return False
        
        result = await self.collection.delete_one({"_id": ObjectId(share_id)})
        return result.deleted_count > 0
    
    async def to_response(self, share: dict) -> ShareResponse:
        """Convert share document to response model."""
        # Get album name
        album = await self.db.albums.find_one({"_id": ObjectId(share["album_id"])})
        album_name = album["name"] if album else "Unknown Album"
        
        # Build absolute share URL
        share_url = f"{settings.FRONTEND_URL}/gallery/{share['token']}"
        
        return ShareResponse(
            id=share["_id"],
            album_id=share["album_id"],
            album_name=album_name,
            token=share["token"],
            share_url=share_url,
            include_subfolders=share.get("include_subfolders", True),
            custom_message=share.get("custom_message"),
            expires_at=share.get("expires_at"),
            is_active=share.get("is_active", True),
            view_count=share.get("view_count", 0),
            created_at=share["created_at"],
            last_accessed_at=share.get("last_accessed_at"),
        )
    
    async def get_client_share_info(self, token: str) -> Optional[ClientShareInfo]:
        """Get public share info for client gallery (before password entry)."""
        share = await self.get_share_by_token(token)
        
        if not share:
            return None
        
        if not share.get("is_active"):
            return None
        
        if share.get("expires_at") and share["expires_at"] < datetime.utcnow():
            return None
        
        # Get album info
        album = await self.db.albums.find_one({"_id": ObjectId(share["album_id"])})
        if not album:
            return None
        
        return ClientShareInfo(
            album_name=album["name"],
            custom_message=share.get("custom_message"),
            image_count=album.get("image_count", 0),
            requires_password=True,
        )
    
    def create_client_access_token(self, share: dict) -> str:
        """Create temporary access token for client image viewing."""
        return create_access_token(
            data={
                "share_id": share["_id"],
                "album_id": share["album_id"],
                "type": "client_access"
            },
            expires_delta=timedelta(hours=24)
        )
