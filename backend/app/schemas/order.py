from datetime import datetime

from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    ticket_type_id: int
    quantity: int = Field(..., ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class OrderItemOut(BaseModel):
    id: int
    event_id: int
    event_title: str
    ticket_type_id: int
    ticket_name: str
    unit_price: float
    quantity: int
    subtotal: float

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    user_id: int
    status: str
    payment_status: str
    payment_provider: str | None = None
    payment_currency: str | None = None
    stripe_session_id: str | None = None
    stripe_payment_intent_id: str | None = None
    total_amount: float
    paid_at: datetime | None = None
    created_at: datetime
    items: list[OrderItemOut]

    class Config:
        from_attributes = True


class CheckoutSessionCreate(BaseModel):
    success_url: str | None = None
    cancel_url: str | None = None


class CheckoutSessionOut(BaseModel):
    order_id: int
    status: str
    payment_status: str
    checkout_url: str | None = None
    session_id: str | None = None


class CheckoutSessionSyncIn(BaseModel):
    session_id: str = Field(..., min_length=3)
