from sqlalchemy.orm import Session
from app.models.event import Event
from app.models.ticket_type import TicketType
from app.schemas.event import EventCreate, EventUpdate


def _event_to_dict(event: Event) -> dict:
    """Convert an Event ORM object to a dict with the tickets property resolved."""
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "date": event.date,
        "time": event.time,
        "location": event.location,
        "image": event.image,
        "price": event.price,
        "capacity": event.capacity,
        "attendees": event.attendees,
        "duration": event.duration,
        "age_min": event.age_min,
        "extra_info": event.extra_info,
        "status": event.status,
        "tickets": [
            {
                "id": t.id,
                "name": t.name,
                "price": t.price,
                "quantity": t.quantity,
                "sold": t.sold,
                "event_id": t.event_id,
            }
            for t in event.ticket_types
        ],
        "organizer_id": event.organizer_id,
    }


def _build_ticket_types(ticket_payload):
    if not ticket_payload:
        return []

    ticket_types = []
    for item in ticket_payload:
        if hasattr(item, "model_dump"):
            data = item.model_dump()
        elif isinstance(item, dict):
            data = item
        else:
            continue

        ticket_types.append(
            TicketType(
                name=str(data.get("name") or "Standard").strip() or "Standard",
                price=float(data.get("price") or 0),
                quantity=int(data.get("quantity") or 0),
            )
        )
    return ticket_types


def create_event(db: Session, data: EventCreate, organizer_id: int):
    payload = data.model_dump(exclude={"tickets"})
    event = Event(**payload, organizer_id=organizer_id)

    for ticket_type in _build_ticket_types(data.tickets):
        event.ticket_types.append(ticket_type)

    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_to_dict(event)


def get_all_events(db: Session):
    return [_event_to_dict(e) for e in db.query(Event).all()]


def get_events_by_organizer(db: Session, organizer_id: int):
    """Return all events owned by a specific organizer."""
    events = db.query(Event).filter(Event.organizer_id == organizer_id).all()
    return [_event_to_dict(e) for e in events]


def get_event_by_id(db: Session, event_id: int):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event:
        return _event_to_dict(event)
    return None


def update_event(db: Session, event_id: int, data: EventUpdate, organizer_id: int):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None
    if event.organizer_id != organizer_id:
        return "forbidden"

    updates = data.model_dump(exclude_unset=True, exclude={"tickets"})
    for key, value in updates.items():
        setattr(event, key, value)

    if data.tickets is not None:
        # Full replace strategy for now (simple and explicit for organizer workflow)
        event.ticket_types.clear()
        for ticket_type in _build_ticket_types(data.tickets):
            event.ticket_types.append(ticket_type)

    db.commit()
    db.refresh(event)
    return _event_to_dict(event)


def delete_event(db: Session, event_id: int, organizer_id: int):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None
    if event.organizer_id != organizer_id:
        return "forbidden"

    result = _event_to_dict(event)
    db.delete(event)
    db.commit()
    return result
