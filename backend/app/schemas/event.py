from pydantic import AliasChoices, BaseModel, Field
from typing import Optional

from app.schemas.ticket_type import TicketTypeCreate, TicketTypeOut


class EventCreate(BaseModel):
    title: str
    date: str                                   # "2026-07-20"
    time: str                                   # "22:00"
    description: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    image: Optional[str] = None
    price: Optional[float] = 0
    capacity: Optional[int] = 0
    attendees: Optional[int] = 0
    duration: Optional[str] = None
    age_min: Optional[int] = 0
    extra_info: Optional[str] = None
    status: Optional[str] = "Publié"
    tickets: Optional[list[TicketTypeCreate]] = Field(
        default=None,
        validation_alias=AliasChoices("tickets", "ticketTiers"),
    )


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    location: Optional[str] = None
    image: Optional[str] = None
    price: Optional[float] = None
    capacity: Optional[int] = None
    attendees: Optional[int] = None
    duration: Optional[str] = None
    age_min: Optional[int] = None
    extra_info: Optional[str] = None
    status: Optional[str] = None
    tickets: Optional[list[TicketTypeCreate]] = Field(
        default=None,
        validation_alias=AliasChoices("tickets", "ticketTiers"),
    )


class EventOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    date: str
    time: str
    location: Optional[str]
    image: Optional[str]
    price: Optional[float]
    capacity: Optional[int]
    attendees: Optional[int]
    duration: Optional[str]
    age_min: Optional[int]
    extra_info: Optional[str]
    status: Optional[str]
    tickets: Optional[list[TicketTypeOut]]
    organizer_id: int

    class Config:
        from_attributes = True


class AdminEventRowOut(BaseModel):
    id: int
    title: str
    organizer_id: int
    organizer_email: str
    date: Optional[str] = None
    status: Optional[str] = None


class OrganizerEventStatsOut(BaseModel):
    event_id: int
    title: str
    status: Optional[str] = None
    date: Optional[str] = None
    location: Optional[str] = None
    capacity: Optional[int] = 0
    attendees: Optional[int] = 0
    revenue: float = 0
    tickets_sold: int = 0
    paid_orders: int = 0
    comments_count: int = 0
    average_rating: Optional[float] = None


class OrganizerSummaryStatsOut(BaseModel):
    total_events: int = 0
    published_events: int = 0
    draft_events: int = 0
    finished_events: int = 0
    total_revenue: float = 0
    total_tickets_sold: int = 0
    total_comments: int = 0
    average_rating: Optional[float] = None
    currency: str = "USD"


class OrganizerDashboardStatsOut(BaseModel):
    summary: OrganizerSummaryStatsOut
    by_event: list[OrganizerEventStatsOut]
