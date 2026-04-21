from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.event import (
    AdminEventRowOut,
    EventCreate,
    EventOut,
    EventUpdate,
    OrganizerDashboardStatsOut,
)
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


@router.get("/my", response_model=List[EventOut])
def get_my_events(
    db: Session = Depends(get_db),
    organizer: User = Depends(role_required("ORGANIZER")),
):
    """Lister les événements de l'organisateur connecté."""
    return event_service.get_events_by_organizer(db, organizer.id)


@router.get("/my/stats", response_model=OrganizerDashboardStatsOut)
def get_my_dashboard_stats(
    db: Session = Depends(get_db),
    organizer: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    """Stats globales et par événement pour le dashboard organisateur."""
    if organizer.role and organizer.role.name == "ADMIN":
        return event_service.get_admin_dashboard_stats(db=db)

    return event_service.get_organizer_dashboard_stats(db=db, organizer_id=organizer.id)


@router.get("/admin/all", response_model=List[AdminEventRowOut])
def get_events_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(role_required("ADMIN")),
):
    """Lister tous les événements pour la gestion admin."""
    return event_service.get_all_events_for_admin(db)


@router.patch("/admin/{event_id}/toggle-status", response_model=AdminEventRowOut)
def toggle_event_status_admin(
    event_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(role_required("ADMIN")),
):
    """Basculer le statut entre Publié et Dépublié (admin)."""
    result = event_service.toggle_event_status_by_admin(db=db, event_id=event_id)
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement non trouvé",
        )
    return result


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
    current_user: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    """Modifier un événement (son organisateur ou admin uniquement)."""
    role_name = current_user.role.name if current_user.role else None
    result = event_service.update_event(
        db,
        event_id,
        event_data,
        actor_user_id=current_user.id,
        actor_role_name=role_name,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Événement non trouvé",
        )
    if result == "admin_depublished_lock":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cet événement est dépublié par un admin et ne peut pas être republié par l'organisateur.",
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
    current_user: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    """Supprimer un événement (son organisateur ou admin uniquement)."""
    role_name = current_user.role.name if current_user.role else None
    result = event_service.delete_event(
        db,
        event_id,
        actor_user_id=current_user.id,
        actor_role_name=role_name,
    )
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
