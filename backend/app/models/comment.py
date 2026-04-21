from datetime import datetime, timezone

from pydantic import BaseModel, Field


class Comment(BaseModel):
    event_id: int
    user_id: int
    user_email: str
    author_role: str | None = None
    rating: int = Field(..., ge=1, le=5)
    content: str = Field(..., min_length=1, max_length=2000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_edited: bool = False
    is_hidden: bool = False
    hidden_by: str | None = None
    hidden_reason: str | None = None

    def to_document(self) -> dict:
        return self.model_dump()
