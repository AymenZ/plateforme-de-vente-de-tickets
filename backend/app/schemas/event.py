from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EventCreate(BaseModel):
    title: str
    event_date: datetime
    description: Optional[str] = None
    category: Optional[str] = None

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    event_date: Optional[datetime] = None

class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    event_date: datetime

    class Config:
        from_attributes = True
