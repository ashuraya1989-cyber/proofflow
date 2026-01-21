"""MongoDB database connection and utilities."""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class Database:
    """Database connection manager."""
    
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None


db = Database()


async def connect_to_database():
    """Initialize database connection."""
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}")
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db.db = db.client[settings.MONGODB_DB_NAME]
    
    # Create indexes
    await create_indexes()
    
    logger.info("Connected to MongoDB successfully")


async def close_database_connection():
    """Close database connection."""
    if db.client:
        db.client.close()
        logger.info("Closed MongoDB connection")


async def create_indexes():
    """Create database indexes for optimal query performance."""
    # Albums collection indexes
    await db.db.albums.create_index("name")
    await db.db.albums.create_index("created_at")
    await db.db.albums.create_index("parent_id")
    
    # Images collection indexes
    await db.db.images.create_index("album_id")
    await db.db.images.create_index("filename")
    await db.db.images.create_index("created_at")
    await db.db.images.create_index([("album_id", 1), ("created_at", -1)])
    
    # Shares collection indexes
    await db.db.shares.create_index("token", unique=True)
    await db.db.shares.create_index("album_id")
    await db.db.shares.create_index("expires_at")
    await db.db.shares.create_index("is_active")
    
    logger.info("Database indexes created")


def get_database() -> AsyncIOMotorDatabase:
    """Get database instance."""
    return db.db
