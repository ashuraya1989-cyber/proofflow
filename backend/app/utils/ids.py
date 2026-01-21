from bson import ObjectId
from fastapi import HTTPException, status


def to_object_id(value: str) -> ObjectId:
    try:
        return ObjectId(value)
    except Exception as exc:  # pragma: no cover - defensive
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid id format.",
        ) from exc


def serialize_id(document: dict) -> dict:
    if "_id" in document:
        document["id"] = str(document.pop("_id"))
    return document
