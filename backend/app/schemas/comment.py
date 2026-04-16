from datetime import datetime

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    content: str = Field(..., min_length=1, max_length=2000)


class CommentUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    content: str | None = Field(default=None, min_length=1, max_length=2000)


class CommentOut(BaseModel):
    id: str
    event_id: int
    user_id: int
    user_email: str
    rating: int
    content: str
    created_at: datetime
    updated_at: datetime
    is_edited: bool
