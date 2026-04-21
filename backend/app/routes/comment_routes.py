from typing import List

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_optional_current_user, role_required
from app.database import get_db
from app.models.user import User
from app.schemas.comment import AdminCommentOut, CommentCreate, CommentOut, CommentUpdate
from app.services import comment_service

router = APIRouter(tags=["Commentaires"])


@router.get("/events/{event_id}/comments", response_model=List[CommentOut])
def list_event_comments(
    event_id: int,
    limit: int = Query(default=100, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Lister les commentaires d'un événement.

    - Utilisateur normal: commentaires visibles uniquement.
    - Admin authentifié: tous les commentaires, y compris masqués.
    """
    return comment_service.list_comments_by_event(
        db=db,
        event_id=event_id,
        current_user=current_user,
        limit=limit,
        skip=skip,
    )


@router.post("/events/{event_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def create_event_comment(
    event_id: int,
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Créer un commentaire pour un événement (utilisateur connecté)."""
    return comment_service.create_comment(db=db, event_id=event_id, data=data, current_user=current_user)


@router.get("/users/me/comments", response_model=List[CommentOut])
def list_my_comments(
    limit: int = Query(default=100, ge=1, le=200),
    skip: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
):
    """Lister mes commentaires."""
    return comment_service.list_comments_by_user(current_user=current_user, limit=limit, skip=skip)


@router.get("/comments/admin/all", response_model=List[AdminCommentOut])
def list_all_comments_admin(
    limit: int = Query(default=200, ge=1, le=500),
    skip: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("ADMIN")),
):
    """Lister tous les commentaires (modération admin)."""
    return comment_service.list_all_comments_for_admin(db=db, limit=limit, skip=skip)


@router.put("/comments/{comment_id}", response_model=CommentOut)
def update_comment(
    comment_id: str,
    data: CommentUpdate,
    current_user: User = Depends(get_current_user),
):
    """Modifier un commentaire (propriétaire uniquement)."""
    return comment_service.update_comment(comment_id=comment_id, data=data, current_user=current_user)


@router.put("/comments/{comment_id}/hide", response_model=CommentOut)
def toggle_comment_hidden(
    comment_id: str,
    current_user: User = Depends(role_required("ADMIN")),
):
    """Masquer/afficher un commentaire (admin uniquement)."""
    return comment_service.toggle_comment_hidden(comment_id=comment_id, current_user=current_user)


@router.delete("/comments/{comment_id}")
def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user),
):
    """Supprimer un commentaire (propriétaire ou admin)."""
    return comment_service.delete_comment(comment_id=comment_id, current_user=current_user)
