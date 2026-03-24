from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.event import Event
from app.models.ticket_type import TicketType
from app.schemas.ticket_type import TicketTypeCreate, TicketTypeUpdate


def _check_event_ownership(db: Session, event_id: int, user_id: int, is_admin: bool) -> Event:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Événement non trouvé")

    if not is_admin and event.organizer_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous ne pouvez gérer que les tickets de vos propres événements",
        )

    return event


def list_ticket_types_by_event(db: Session, event_id: int):
    return db.query(TicketType).filter(TicketType.event_id == event_id).all()


def create_ticket_type(
    db: Session,
    event_id: int,
    data: TicketTypeCreate,
    user_id: int,
    is_admin: bool,
):
    _check_event_ownership(db, event_id, user_id, is_admin)

    ticket = TicketType(
        name=data.name,
        price=data.price,
        quantity=data.quantity,
        event_id=event_id,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def update_ticket_type(
    db: Session,
    event_id: int,
    ticket_id: int,
    data: TicketTypeUpdate,
    user_id: int,
    is_admin: bool,
):
    _check_event_ownership(db, event_id, user_id, is_admin)

    ticket = (
        db.query(TicketType)
        .filter(TicketType.id == ticket_id, TicketType.event_id == event_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Type de ticket non trouvé")

    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(ticket, key, value)

    if ticket.sold > ticket.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La quantité ne peut pas être inférieure au nombre déjà vendu",
        )

    db.commit()
    db.refresh(ticket)
    return ticket


def delete_ticket_type(
    db: Session,
    event_id: int,
    ticket_id: int,
    user_id: int,
    is_admin: bool,
):
    _check_event_ownership(db, event_id, user_id, is_admin)

    ticket = (
        db.query(TicketType)
        .filter(TicketType.id == ticket_id, TicketType.event_id == event_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Type de ticket non trouvé")

    if ticket.sold > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de supprimer un type de ticket déjà vendu",
        )

    db.delete(ticket)
    db.commit()
    return {"message": "Type de ticket supprimé avec succès"}
