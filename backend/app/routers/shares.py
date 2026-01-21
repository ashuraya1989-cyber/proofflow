from fastapi import APIRouter, HTTPException, Body
from app.models import ShareModel, AlbumModel
from app.schemas import ShareCreate, ShareResponse, ShareAccess
from app.database import db
from app.config import settings
from bson import ObjectId
import secrets
import hashlib
from datetime import datetime

router = APIRouter()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/", response_model=ShareResponse)
async def create_share_link(share_data: ShareCreate):
    if not ObjectId.is_valid(share_data.album_id):
        raise HTTPException(status_code=400, detail="Invalid Album ID")

    # Check if album exists
    album = await db.db.albums.find_one({"_id": ObjectId(share_data.album_id)})
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
        
    token = secrets.token_urlsafe(16)
    
    password_hash = None
    if share_data.password:
        password_hash = hash_password(share_data.password)
        
    new_share = ShareModel(
        album_id=share_data.album_id,
        share_token=token,
        password_hash=password_hash,
        expires_at=share_data.expires_at
    )
    
    await db.db.shares.insert_one(new_share.model_dump(by_alias=True))
    
    # Generate absolute URL (assuming client is at root or config provided)
    # The client URL logic should ideally be in frontend or configurable
    # For now, we return the relative part or construct based on origin if known
    
    return ShareResponse(
        id=str(new_share.id),
        album_id=new_share.album_id,
        share_link=token,
        is_protected=bool(password_hash),
        created_at=new_share.created_at,
        expires_at=new_share.expires_at
    )

@router.post("/validate/{token}")
async def validate_share(token: str, access: ShareAccess = Body(None)):
    share = await db.db.shares.find_one({"share_token": token, "is_active": True})
    if not share:
        raise HTTPException(status_code=404, detail="Link invalid or expired")
        
    if share.get("expires_at") and share["expires_at"] < datetime.utcnow():
        raise HTTPException(status_code=410, detail="Link expired")
        
    if share.get("password_hash"):
        if not access or not access.password:
             raise HTTPException(status_code=401, detail="Password required")
        if hash_password(access.password) != share["password_hash"]:
             raise HTTPException(status_code=403, detail="Invalid password")
             
    # If valid, return album details + content
    album = await db.db.albums.find_one({"_id": ObjectId(share["album_id"])})
    if not album:
         raise HTTPException(status_code=404, detail="Album not found")
         
    return {
        "status": "valid",
        "album": {
            "id": str(album["_id"]),
            "name": album["name"]
        }
    }
