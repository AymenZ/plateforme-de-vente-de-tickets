from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(30), nullable=False, default="CART")
    payment_status = Column(String(30), nullable=False, default="UNPAID")
    payment_provider = Column(String(30), nullable=True)
    payment_currency = Column(String(10), nullable=False, default="usd")
    stripe_session_id = Column(String(191), nullable=True, unique=True, index=True)
    stripe_payment_intent_id = Column(String(191), nullable=True, index=True)
    total_amount = Column(Float, nullable=False, default=0)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    tickets = relationship(
        "Ticket",
        back_populates="order",
        cascade="all, delete-orphan",
    )
