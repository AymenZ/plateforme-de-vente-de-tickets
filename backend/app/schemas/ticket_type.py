from pydantic import BaseModel, Field
from typing import Optional


class TicketTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., ge=0)
    quantity: int = Field(..., ge=0)


class TicketTypeCreate(TicketTypeBase):
    pass


class TicketTypeUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    price: Optional[float] = Field(default=None, ge=0)
    quantity: Optional[int] = Field(default=None, ge=0)


class TicketTypeOut(TicketTypeBase):
    id: int
    sold: int
    event_id: int

    class Config:
        from_attributes = True
