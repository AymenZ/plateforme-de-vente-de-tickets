from sqlalchemy.orm import Session
from app.models.event import Event
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
        "tickets": event.tickets,
        "organizer_id": event.organizer_id,
    }


def create_event(db: Session, data: EventCreate, organizer_id: int):
    event = Event(**data.model_dump(), organizer_id=organizer_id)
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

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(event, key, value)

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
