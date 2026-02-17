from sqlalchemy.orm import Session
from app.models.event import Event
from app.schemas.event import EventCreate, EventUpdate


def create_event(db: Session, data: EventCreate, organizer_id: int):
    event = Event(**data.model_dump(), organizer_id=organizer_id)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def get_all_events(db: Session):
    return db.query(Event).all()


def get_event_by_id(db: Session, event_id: int):
    return db.query(Event).filter(Event.id == event_id).first()


def update_event(db: Session, event_id: int, data: EventUpdate, organizer_id: int):
    event = get_event_by_id(db, event_id)
    if not event:
        return None
    if event.organizer_id != organizer_id:
        return "forbidden"

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(event, key, value)

    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: int, organizer_id: int):
    event = get_event_by_id(db, event_id)
    if not event:
        return None
    if event.organizer_id != organizer_id:
        return "forbidden"

    db.delete(event)
    db.commit()
    return event
