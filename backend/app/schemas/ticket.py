from datetime import datetime

from pydantic import BaseModel


class TicketOut(BaseModel):
    id: int
    ticket_code: str
    qr_value: str
    status: str

    order_id: int
    order_item_id: int | None = None
    user_id: int
    event_id: int
    ticket_type_id: int

    event_title: str
    ticket_name: str
    unit_price: float

    purchased_at: datetime
    used_at: datetime | None = None

    class Config:
        from_attributes = True


class TicketVerifyOut(BaseModel):
    ticket_code: str
    status: str
    is_valid: bool
    event_title: str
    ticket_name: str
    order_id: int
    purchased_at: datetime
    used_at: datetime | None = None
