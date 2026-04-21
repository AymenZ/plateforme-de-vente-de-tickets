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
    is_hidden: bool = False
    is_admin_author: bool = False
    hidden_by: str | None = None
    hidden_reason: str | None = None


class AdminCommentOut(BaseModel):
    id: str
    author_email: str
    event_id: int
    event_title: str
    rating: int
    content: str
    created_at: datetime
    is_hidden: bool = False
    hidden_by: str | None = None
    hidden_reason: str | None = None
