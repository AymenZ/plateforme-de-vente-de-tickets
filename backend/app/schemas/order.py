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
    total_amount: float
    created_at: datetime
    items: list[OrderItemOut]

    class Config:
        from_attributes = True
