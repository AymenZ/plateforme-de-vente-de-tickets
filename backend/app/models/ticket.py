from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    ticket_code = Column(String(120), nullable=False, unique=True, index=True)
    qr_value = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="VALID")

    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False, index=True)
    ticket_type_id = Column(Integer, ForeignKey("ticket_types.id"), nullable=False, index=True)

    event_title = Column(String(255), nullable=False)
    ticket_name = Column(String(100), nullable=False)
    unit_price = Column(Float, nullable=False, default=0)

    purchased_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    used_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="tickets")
    user = relationship("User", back_populates="tickets")
    event = relationship("Event")
    ticket_type = relationship("TicketType")
