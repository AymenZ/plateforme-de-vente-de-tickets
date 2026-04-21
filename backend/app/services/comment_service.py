from datetime import datetime, timezone
import json
import logging
import time
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException, status
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError, PyMongoError
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.core.config import (
    GEMINI_API_KEY,
    GEMINI_ENABLED,
    GEMINI_ENDPOINT_BASE,
    GEMINI_MODEL,
)
from app.models.event import Event
from app.models.user import User
from app.mongodb import get_comments_collection
from app.schemas.comment import CommentCreate, CommentUpdate

_indexes_ready = False
_logger = logging.getLogger(__name__)
_DEFAULT_GEMINI_MODEL = "gemini-2.5-flash"


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
    author_role = str(doc.get("author_role") or "").strip().upper()

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
        "is_hidden": bool(doc.get("is_hidden", False)),
        "is_admin_author": author_role == "ADMIN",
        "hidden_by": doc.get("hidden_by"),
        "hidden_reason": doc.get("hidden_reason"),
    }


def _ensure_event_exists(db: Session, event_id: int) -> None:
    exists = db.query(Event).filter(Event.id == event_id).first()
    if not exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement non trouvé",
        )


def _extract_flagged_from_gemini_text(raw_text: str) -> bool:
    text = (raw_text or "").strip()
    if not text:
        return False

    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()

    try:
        parsed = json.loads(text)
    except ValueError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return False
        try:
            parsed = json.loads(text[start : end + 1])
        except ValueError:
            return False

    flagged = parsed.get("flagged")
    if isinstance(flagged, bool):
        return flagged
    if isinstance(flagged, str):
        return flagged.strip().lower() == "true"
    return False


def _is_flagged_by_gemini(comment_content: str) -> bool:
    """Return True when Gemini moderation-classifier flags the content.

    Graceful degradation: if API fails, return False and keep user flow unblocked.
    """
    if not GEMINI_ENABLED:
        return False

    if not GEMINI_API_KEY:
        _logger.warning("Gemini moderation enabled but API key is missing")
        return False

    model = (GEMINI_MODEL or _DEFAULT_GEMINI_MODEL).strip() or _DEFAULT_GEMINI_MODEL
    base = (GEMINI_ENDPOINT_BASE or "https://generativelanguage.googleapis.com/v1beta/models").rstrip("/")
    endpoint = f"{base}/{model}:generateContent?key={urllib_parse.quote(GEMINI_API_KEY)}"

    moderation_prompt = (
        "You are a strict content moderation classifier for user comments. "
        "If the comment is offensive, abusive, hateful, threatening, sexually explicit, or harassing, set flagged to true. "
        "Otherwise set flagged to false. "
        "Return ONLY JSON with this exact shape: {\"flagged\": true|false}.\n\n"
        f"Comment:\n{comment_content}"
    )

    payload = json.dumps(
        {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": moderation_prompt}],
                }
            ],
            "generationConfig": {
                "temperature": 0,
                "responseMimeType": "application/json",
            },
        }
    ).encode("utf-8")

    req = urllib_request.Request(
        endpoint,
        data=payload,
        method="POST",
        headers={"Content-Type": "application/json"},
    )

    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            with urllib_request.urlopen(req, timeout=10) as response:
                body = response.read().decode("utf-8")
                data = json.loads(body or "{}")

                candidates = data.get("candidates") or []
                if not candidates:
                    return False

                content = candidates[0].get("content") or {}
                parts = content.get("parts") or []
                text = "".join(str(part.get("text") or "") for part in parts if isinstance(part, dict))
                return _extract_flagged_from_gemini_text(text)
        except urllib_error.HTTPError as exc:
            error_text = ""
            try:
                error_text = exc.read().decode("utf-8")
            except Exception:
                error_text = str(exc)

            is_retryable = exc.code in {429, 500, 503}
            has_next = attempt < (max_attempts - 1)
            if is_retryable and has_next:
                wait_seconds = 0.6 * (2**attempt)
                _logger.warning(
                    "Gemini moderation temporary HTTP %s (attempt %s/%s), retrying in %.1fs",
                    exc.code,
                    attempt + 1,
                    max_attempts,
                    wait_seconds,
                )
                time.sleep(wait_seconds)
                continue

            _logger.warning(
                "Gemini moderation unavailable (HTTP %s), saving comment without auto-hide: %s",
                exc.code,
                error_text,
            )
            return False
        except (urllib_error.URLError, TimeoutError, ValueError) as exc:
            has_next = attempt < (max_attempts - 1)
            if has_next:
                wait_seconds = 0.6 * (2**attempt)
                _logger.warning(
                    "Gemini moderation temporary error (attempt %s/%s), retrying in %.1fs: %s",
                    attempt + 1,
                    max_attempts,
                    wait_seconds,
                    exc,
                )
                time.sleep(wait_seconds)
                continue

            _logger.warning(
                "Gemini moderation unavailable, saving comment without auto-hide: %s",
                exc,
            )
            return False

    return False


def get_comment_stats_for_events(event_ids: list[int]) -> dict[int, dict]:
    if not event_ids:
        return {}

    try:
        _ensure_indexes()
        collection = get_comments_collection()
        pipeline = [
            {
                "$match": {
                    "event_id": {"$in": event_ids},
                    "is_hidden": {"$ne": True},
                }
            },
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


def list_comments_by_event(
    db: Session,
    event_id: int,
    current_user: User | None = None,
    limit: int = 100,
    skip: int = 0,
):
    _ensure_event_exists(db, event_id)

    try:
        _ensure_indexes()
        collection = get_comments_collection()
        is_admin = bool(current_user and current_user.role and current_user.role.name == "ADMIN")

        query: dict = {"event_id": event_id}
        if not is_admin:
            query["is_hidden"] = {"$ne": True}

        docs = (
            collection.find(query)
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
                    "is_hidden": bool(doc.get("is_hidden", False)),
                    "hidden_by": doc.get("hidden_by"),
                    "hidden_reason": doc.get("hidden_reason"),
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
        is_hidden = _is_flagged_by_gemini(cleaned_content)
        author_role = current_user.role.name if current_user.role else None
        hidden_by = "AI" if is_hidden else None
        hidden_reason = "offensive_language" if is_hidden else None

        comment = Comment(
            event_id=event_id,
            user_id=current_user.id,
            user_email=current_user.email,
            author_role=author_role,
            rating=data.rating,
            content=cleaned_content,
            created_at=now,
            updated_at=now,
            is_edited=False,
            is_hidden=is_hidden,
            hidden_by=hidden_by,
            hidden_reason=hidden_reason,
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

        if existing.get("user_id") != current_user.id:
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


def toggle_comment_hidden(comment_id: str, current_user: User):
    oid = _parse_object_id(comment_id)

    is_admin = bool(current_user.role and current_user.role.name == "ADMIN")
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seul un administrateur peut masquer un commentaire",
        )

    try:
        _ensure_indexes()
        collection = get_comments_collection()
        existing = collection.find_one({"_id": oid})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Commentaire non trouvé",
            )

        next_hidden_value = not bool(existing.get("is_hidden", False))
        hidden_by = "ADMIN" if next_hidden_value else None
        hidden_reason = "admin_action" if next_hidden_value else None
        collection.update_one(
            {"_id": oid},
            {
                "$set": {
                    "is_hidden": next_hidden_value,
                    "hidden_by": hidden_by,
                    "hidden_reason": hidden_reason,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        updated = collection.find_one({"_id": oid})
        return _serialize_comment(updated)
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service commentaires indisponible",
        )
