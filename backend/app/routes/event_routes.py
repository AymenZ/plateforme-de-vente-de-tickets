from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.event import EventCreate, EventUpdate, EventOut
from app.services import event_service
from app.models.user import User
from app.core.dependencies import get_current_user, role_required

router = APIRouter(prefix="/events", tags=["Événements"])


@router.post("/", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    organizer: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    """Créer un événement (organisateur ou admin uniquement)."""
    return event_service.create_event(db, event, organizer.id)


@router.get("/", response_model=List[EventOut])
def get_events(db: Session = Depends(get_db)):
    """Lister tous les événements (accessible à tous)."""
    return event_service.get_all_events(db)


@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Afficher les détails d'un événement (accessible à tous)."""
    event = event_service.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement non trouvé",
        )
    return event


@router.put("/{event_id}", response_model=EventOut)
def update_event(
    event_id: int,
    event_data: EventUpdate,
    db: Session = Depends(get_db),
    organizer: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    """Modifier un événement (son organisateur ou admin uniquement)."""
    result = event_service.update_event(db, event_id, event_data, organizer.id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement non trouvé",
        )
    if result == "forbidden":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez modifier que vos propres événements",
        )
    return result


@router.delete("/{event_id}", status_code=status.HTTP_200_OK)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    organizer: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    """Supprimer un événement (son organisateur ou admin uniquement)."""
    result = event_service.delete_event(db, event_id, organizer.id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement non trouvé",
        )
    if result == "forbidden":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez supprimer que vos propres événements",
        )
    return {"message": "Événement supprimé avec succès"}
