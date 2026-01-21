"""Image service for business logic operations."""
import os
import uuid
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Optional, List, BinaryIO
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from PIL import Image as PILImage
import aiofiles

from app.models.image import ImageCreate, ImageResponse, ImageResolution
from app.core.config import settings


class ImageService:
    """Service for image operations."""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.images
        self.upload_dir = Path(settings.UPLOAD_DIR)
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Ensure upload directories exist."""
        for subdir in ["original", "medium", "thumbnail"]:
            (self.upload_dir / subdir).mkdir(parents=True, exist_ok=True)
    
    def _get_image_path(self, filename: str, resolution: ImageResolution) -> Path:
        """Get the file path for an image at a specific resolution."""
        return self.upload_dir / resolution.value / filename
    
    async def process_and_save_image(
        self,
        file_content: bytes,
        original_filename: str,
        album_id: str,
        mime_type: str
    ) -> dict:
        """Process uploaded image and save at multiple resolutions."""
        # Generate unique filename
        ext = original_filename.rsplit(".", 1)[-1].lower()
        unique_filename = f"{uuid.uuid4()}.{ext}"
        
        # Save original
        original_path = self._get_image_path(unique_filename, ImageResolution.ORIGINAL)
        async with aiofiles.open(original_path, "wb") as f:
            await f.write(file_content)
        
        # Process with PIL for dimensions and resized versions
        loop = asyncio.get_event_loop()
        dimensions, has_medium, has_thumbnail = await loop.run_in_executor(
            None,
            self._process_image_sync,
            original_path,
            unique_filename
        )
        
        # Create database record
        image_doc = {
            "album_id": album_id,
            "filename": unique_filename,
            "original_filename": original_filename,
            "mime_type": mime_type,
            "file_size": len(file_content),
            "width": dimensions[0],
            "height": dimensions[1],
            "has_thumbnail": has_thumbnail,
            "has_medium": has_medium,
            "created_at": datetime.utcnow(),
        }
        
        result = await self.collection.insert_one(image_doc)
        image_doc["_id"] = str(result.inserted_id)
        
        # Update album image count
        await self.db.albums.update_one(
            {"_id": ObjectId(album_id)},
            {
                "$inc": {"image_count": 1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Set as cover if album doesn't have one
        album = await self.db.albums.find_one({"_id": ObjectId(album_id)})
        if album and not album.get("cover_image_id"):
            await self.db.albums.update_one(
                {"_id": ObjectId(album_id)},
                {"$set": {"cover_image_id": image_doc["_id"]}}
            )
        
        return image_doc
    
    def _process_image_sync(self, original_path: Path, filename: str) -> tuple:
        """Synchronous image processing (run in executor)."""
        with PILImage.open(original_path) as img:
            # Convert to RGB if necessary (for PNG with transparency, etc.)
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            original_size = img.size
            
            # Create medium resolution
            medium_path = self._get_image_path(filename, ImageResolution.MEDIUM)
            medium_img = self._resize_image(img.copy(), settings.MEDIUM_SIZE)
            medium_img.save(medium_path, "JPEG", quality=90, optimize=True)
            has_medium = True
            
            # Create thumbnail
            thumbnail_path = self._get_image_path(filename, ImageResolution.THUMBNAIL)
            thumbnail_img = self._resize_image(img.copy(), settings.THUMBNAIL_SIZE)
            thumbnail_img.save(thumbnail_path, "JPEG", quality=85, optimize=True)
            has_thumbnail = True
            
            return original_size, has_medium, has_thumbnail
    
    def _resize_image(self, img: PILImage.Image, max_size: tuple) -> PILImage.Image:
        """Resize image maintaining aspect ratio."""
        img.thumbnail(max_size, PILImage.Resampling.LANCZOS)
        return img
    
    async def get_image(self, image_id: str) -> Optional[dict]:
        """Get image by ID."""
        if not ObjectId.is_valid(image_id):
            return None
        
        image = await self.collection.find_one({"_id": ObjectId(image_id)})
        if image:
            image["_id"] = str(image["_id"])
        return image
    
    async def get_images_by_album(
        self,
        album_id: str,
        skip: int = 0,
        limit: int = 50
    ) -> List[dict]:
        """Get images in an album."""
        cursor = self.collection.find({"album_id": album_id}) \
            .sort("created_at", -1) \
            .skip(skip) \
            .limit(limit)
        
        images = []
        async for image in cursor:
            image["_id"] = str(image["_id"])
            images.append(image)
        return images
    
    async def get_images_by_albums(
        self,
        album_ids: List[str],
        skip: int = 0,
        limit: int = 50
    ) -> List[dict]:
        """Get images from multiple albums (for 'All' view)."""
        cursor = self.collection.find({"album_id": {"$in": album_ids}}) \
            .sort("created_at", -1) \
            .skip(skip) \
            .limit(limit)
        
        images = []
        async for image in cursor:
            image["_id"] = str(image["_id"])
            images.append(image)
        return images
    
    async def count_images_in_albums(self, album_ids: List[str]) -> int:
        """Count total images across multiple albums."""
        return await self.collection.count_documents({"album_id": {"$in": album_ids}})
    
    async def get_image_file(
        self,
        image_id: str,
        resolution: ImageResolution = ImageResolution.ORIGINAL
    ) -> Optional[tuple]:
        """Get image file path and mime type."""
        image = await self.get_image(image_id)
        if not image:
            return None
        
        filename = image["filename"]
        
        # For original, use stored mime type; for resized, always JPEG
        if resolution == ImageResolution.ORIGINAL:
            mime_type = image["mime_type"]
        else:
            mime_type = "image/jpeg"
        
        file_path = self._get_image_path(filename, resolution)
        
        # Fall back to original if requested resolution doesn't exist
        if not file_path.exists():
            file_path = self._get_image_path(filename, ImageResolution.ORIGINAL)
            mime_type = image["mime_type"]
        
        if not file_path.exists():
            return None
        
        return file_path, mime_type
    
    async def delete_image(self, image_id: str) -> bool:
        """Delete an image and its files."""
        image = await self.get_image(image_id)
        if not image:
            return False
        
        # Delete files
        for resolution in ImageResolution:
            file_path = self._get_image_path(image["filename"], resolution)
            if file_path.exists():
                file_path.unlink()
        
        # Update album count
        await self.db.albums.update_one(
            {"_id": ObjectId(image["album_id"])},
            {
                "$inc": {"image_count": -1},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Clear cover image if this was it
        album = await self.db.albums.find_one({"_id": ObjectId(image["album_id"])})
        if album and album.get("cover_image_id") == image_id:
            # Find another image to set as cover
            other_image = await self.collection.find_one({
                "album_id": image["album_id"],
                "_id": {"$ne": ObjectId(image_id)}
            })
            new_cover = str(other_image["_id"]) if other_image else None
            await self.db.albums.update_one(
                {"_id": ObjectId(image["album_id"])},
                {"$set": {"cover_image_id": new_cover}}
            )
        
        # Delete database record
        await self.collection.delete_one({"_id": ObjectId(image_id)})
        return True
    
    async def delete_images_by_album(self, album_id: str) -> int:
        """Delete all images in an album."""
        # Get all images first
        images = await self.get_images_by_album(album_id, limit=10000)
        
        for image in images:
            # Delete files
            for resolution in ImageResolution:
                file_path = self._get_image_path(image["filename"], resolution)
                if file_path.exists():
                    file_path.unlink()
        
        # Delete database records
        result = await self.collection.delete_many({"album_id": album_id})
        return result.deleted_count
    
    def to_response(self, image: dict) -> ImageResponse:
        """Convert image document to response model."""
        base_url = f"{settings.BASE_URL}/api/images/{image['_id']}"
        
        return ImageResponse(
            id=image["_id"],
            album_id=image["album_id"],
            filename=image["filename"],
            original_filename=image["original_filename"],
            mime_type=image["mime_type"],
            file_size=image["file_size"],
            width=image["width"],
            height=image["height"],
            thumbnail_url=f"{base_url}/thumbnail",
            medium_url=f"{base_url}/medium",
            original_url=f"{base_url}/original",
            created_at=image["created_at"],
        )
