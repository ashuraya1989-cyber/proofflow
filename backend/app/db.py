from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import get_settings

client: AsyncIOMotorClient | None = None
db = None


async def connect_db() -> None:
    settings = get_settings()
    global client, db
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db]
    await ensure_indexes()


async def close_db() -> None:
    if client is not None:
        client.close()


async def ensure_indexes() -> None:
    if db is None:
        return
    await db["albums"].create_index("name", unique=True)
    await db["images"].create_index([("album_id", 1), ("folder", 1)])
    await db["shares"].create_index("token", unique=True)
    await db["shares"].create_index([("album_id", 1), ("folder", 1)])
