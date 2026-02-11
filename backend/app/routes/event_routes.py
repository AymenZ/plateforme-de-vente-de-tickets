from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import SessionLocal
from app.schemas.event import EventCreate, EventUpdate, EventOut
from app.services import event_service

router = APIRouter(prefix="/events", tags=["Events"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=EventOut)
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    return event_service.create_event(db, event)

@router.get("/", response_model=List[EventOut])
def get_events(db: Session = Depends(get_db)):
    return event_service.get_all_events(db)

@router.get("/{event_id}", response_model=EventOut)
def get_event(event_id: int, db: Session = Depends(get_db)):
    event = event_service.get_event_by_id(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.put("/{event_id}", response_model=EventOut)
def update_event(event_id: int, event_data: EventUpdate, db: Session = Depends(get_db)):
    event = event_service.update_event(db, event_id, event_data)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = event_service.delete_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Event deleted successfully"}
