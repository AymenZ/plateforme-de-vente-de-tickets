from sqlalchemy import Column, ForeignKey, Integer, String, Float
from sqlalchemy.orm import relationship

from app.database import Base


class TicketType(Base):
    __tablename__ = "ticket_types"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False, default=0)
    quantity = Column(Integer, nullable=False, default=0)
    sold = Column(Integer, nullable=False, default=0)

    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    event = relationship("Event", back_populates="ticket_types")
    order_items = relationship("OrderItem", back_populates="ticket_type")
