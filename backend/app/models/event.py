from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(String(50))
    date = Column(String(10), nullable=False)          # "2026-07-20"
    time = Column(String(10), nullable=False)           # "22:00"
    location = Column(String(255))
    image = Column(String(500))                         # URL
    price = Column(Float, default=0)                    # base price (TND)
    capacity = Column(Integer, default=0)
    attendees = Column(Integer, default=0)
    duration = Column(String(50))                       # "3h"
    age_min = Column(Integer, default=0)
    extra_info = Column(Text)
    status = Column(String(20), default="Publié")        # Publié | Brouillon | Terminé
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    organizer = relationship("User", backref="events")
    ticket_types = relationship(
        "TicketType",
        back_populates="event",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
