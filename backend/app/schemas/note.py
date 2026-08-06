from pydantic import BaseModel
from datetime import datetime


class NoteCreate(BaseModel):
    content: str


class NoteUpdate(BaseModel):
    content: str


class NoteResponse(BaseModel):
    id: int
    content: str
    lead_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True