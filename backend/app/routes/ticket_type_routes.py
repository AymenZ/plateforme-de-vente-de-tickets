from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import role_required
from app.database import get_db
from app.models.user import User
from app.schemas.ticket_type import TicketTypeCreate, TicketTypeOut, TicketTypeUpdate
from app.services import ticket_type_service

router = APIRouter(prefix="/events/{event_id}/tickets", tags=["Types de tickets"])


@router.get("/", response_model=List[TicketTypeOut])
def list_ticket_types(event_id: int, db: Session = Depends(get_db)):
    """Lister les types de tickets d'un événement (public)."""
    return ticket_type_service.list_ticket_types_by_event(db, event_id)


@router.post("/", response_model=TicketTypeOut)
def create_ticket_type(
    event_id: int,
    data: TicketTypeCreate,
    db: Session = Depends(get_db),
    user: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    """Créer un type de ticket (organisateur propriétaire ou admin)."""
    return ticket_type_service.create_ticket_type(
        db=db,
        event_id=event_id,
        data=data,
        user_id=user.id,
        is_admin=(user.role.name == "ADMIN"),
    )


@router.put("/{ticket_id}", response_model=TicketTypeOut)
def update_ticket_type(
    event_id: int,
    ticket_id: int,
    data: TicketTypeUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    """Modifier un type de ticket (organisateur propriétaire ou admin)."""
    return ticket_type_service.update_ticket_type(
        db=db,
        event_id=event_id,
        ticket_id=ticket_id,
        data=data,
        user_id=user.id,
        is_admin=(user.role.name == "ADMIN"),
    )


@router.delete("/{ticket_id}")
def delete_ticket_type(
    event_id: int,
    ticket_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(role_required("ORGANIZER", "ADMIN")),
):
    """Supprimer un type de ticket (organisateur propriétaire ou admin)."""
    return ticket_type_service.delete_ticket_type(
        db=db,
        event_id=event_id,
        ticket_id=ticket_id,
        user_id=user.id,
        is_admin=(user.role.name == "ADMIN"),
    )
