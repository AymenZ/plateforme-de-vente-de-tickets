from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError, PyMongoError
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.models.event import Event
from app.models.user import User
from app.mongodb import get_comments_collection
from app.schemas.comment import CommentCreate, CommentUpdate

_indexes_ready = False


def _ensure_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return

    collection = get_comments_collection()
    collection.create_index([("event_id", ASCENDING), ("created_at", DESCENDING)])
    collection.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    collection.create_index([("event_id", ASCENDING), ("user_id", ASCENDING)], unique=True)
    _indexes_ready = True


def _parse_object_id(comment_id: str) -> ObjectId:
    try:
        return ObjectId(comment_id)
    except (InvalidId, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Identifiant de commentaire invalide",
        )


def _serialize_comment(doc: dict) -> dict:
    return {
        "id": str(doc.get("_id")),
        "event_id": doc.get("event_id"),
        "user_id": doc.get("user_id"),
        "user_email": doc.get("user_email"),
        "rating": doc.get("rating"),
        "content": doc.get("content"),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
        "is_edited": doc.get("is_edited", False),
    }


def _ensure_event_exists(db: Session, event_id: int) -> None:
    exists = db.query(Event).filter(Event.id == event_id).first()
    if not exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement non trouvé",
        )


def get_comment_stats_for_events(event_ids: list[int]) -> dict[int, dict]:
    if not event_ids:
        return {}

    try:
        _ensure_indexes()
        collection = get_comments_collection()
        pipeline = [
            {"$match": {"event_id": {"$in": event_ids}}},
            {
                "$group": {
                    "_id": "$event_id",
                    "comments_count": {"$sum": 1},
                    "average_rating": {"$avg": "$rating"},
                    "rating_sum": {"$sum": "$rating"},
                }
            },
        ]

        output: dict[int, dict] = {}
        for row in collection.aggregate(pipeline):
            event_id = int(row.get("_id"))
            comments_count = int(row.get("comments_count") or 0)
            average_rating = row.get("average_rating")
            rating_sum = float(row.get("rating_sum") or 0.0)

            output[event_id] = {
                "comments_count": comments_count,
                "average_rating": float(average_rating) if average_rating is not None else None,
                "rating_sum": rating_sum,
            }

        return output
    except PyMongoError:
        return {}


def list_comments_by_event(db: Session, event_id: int, limit: int = 100, skip: int = 0):
    _ensure_event_exists(db, event_id)

    try:
        _ensure_indexes()
        collection = get_comments_collection()
        docs = (
            collection.find({"event_id": event_id})
            .sort("created_at", DESCENDING)
            .skip(skip)
            .limit(limit)
        )
        return [_serialize_comment(doc) for doc in docs]
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service commentaires indisponible",
        )


def list_comments_by_user(current_user: User, limit: int = 100, skip: int = 0):
    try:
        _ensure_indexes()
        collection = get_comments_collection()
        docs = (
            collection.find({"user_id": current_user.id})
            .sort("created_at", DESCENDING)
            .skip(skip)
            .limit(limit)
        )
        return [_serialize_comment(doc) for doc in docs]
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service commentaires indisponible",
        )


def list_all_comments_for_admin(db: Session, limit: int = 200, skip: int = 0):
    try:
        _ensure_indexes()
        collection = get_comments_collection()
        docs = list(
            collection.find({})
            .sort("created_at", DESCENDING)
            .skip(skip)
            .limit(limit)
        )

        if not docs:
            return []

        event_ids = sorted(
            {
                int(doc.get("event_id"))
                for doc in docs
                if doc.get("event_id") is not None
            }
        )
        event_titles_by_id: dict[int, str] = {}

        if event_ids:
            rows = (
                db.query(Event.id, Event.title)
                .filter(Event.id.in_(event_ids))
                .all()
            )
            event_titles_by_id = {
                int(row.id): str(row.title or "")
                for row in rows
            }

        serialized = []
        for doc in docs:
            event_id = int(doc.get("event_id") or 0)
            event_title = event_titles_by_id.get(event_id)
            if not event_title:
                event_title = f"Événement #{event_id}" if event_id > 0 else "Événement inconnu"

            serialized.append(
                {
                    "id": str(doc.get("_id")),
                    "author_email": str(doc.get("user_email") or "Utilisateur inconnu"),
                    "event_id": event_id,
                    "event_title": event_title,
                    "rating": int(doc.get("rating") or 0),
                    "content": str(doc.get("content") or ""),
                    "created_at": doc.get("created_at") or datetime.now(timezone.utc),
                }
            )

        return serialized
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service commentaires indisponible",
        )


def create_comment(db: Session, event_id: int, data: CommentCreate, current_user: User):
    _ensure_event_exists(db, event_id)

    cleaned_content = data.content.strip()
    if not cleaned_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le contenu du commentaire est requis",
        )

    try:
        _ensure_indexes()
        collection = get_comments_collection()
        now = datetime.now(timezone.utc)

        comment = Comment(
            event_id=event_id,
            user_id=current_user.id,
            user_email=current_user.email,
            rating=data.rating,
            content=cleaned_content,
            created_at=now,
            updated_at=now,
            is_edited=False,
        )

        result = collection.insert_one(comment.to_document())
        created = collection.find_one({"_id": result.inserted_id})
        return _serialize_comment(created)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Vous avez déjà commenté cet événement",
        )
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service commentaires indisponible",
        )


def update_comment(comment_id: str, data: CommentUpdate, current_user: User):
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune donnée à mettre à jour",
        )

    if "content" in updates:
        updates["content"] = updates["content"].strip()
        if not updates["content"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le contenu du commentaire est requis",
            )

    oid = _parse_object_id(comment_id)

    try:
        _ensure_indexes()
        collection = get_comments_collection()
        existing = collection.find_one({"_id": oid})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commentaire non trouvé",
            )

        is_admin = bool(current_user.role and current_user.role.name == "ADMIN")
        if existing.get("user_id") != current_user.id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez modifier que vos propres commentaires",
            )

        updates["updated_at"] = datetime.now(timezone.utc)
        updates["is_edited"] = True
        collection.update_one({"_id": oid}, {"$set": updates})

        updated = collection.find_one({"_id": oid})
        return _serialize_comment(updated)
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service commentaires indisponible",
        )


def delete_comment(comment_id: str, current_user: User):
    oid = _parse_object_id(comment_id)

    try:
        _ensure_indexes()
        collection = get_comments_collection()
        existing = collection.find_one({"_id": oid})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commentaire non trouvé",
            )

        is_admin = bool(current_user.role and current_user.role.name == "ADMIN")
        if existing.get("user_id") != current_user.id and not is_admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Vous ne pouvez supprimer que vos propres commentaires",
            )

        collection.delete_one({"_id": oid})
        return {"message": "Commentaire supprimé avec succès"}
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service commentaires indisponible",
        )
