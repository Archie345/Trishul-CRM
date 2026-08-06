from pydantic import BaseModel
from datetime import date, datetime


class TaskCreate(BaseModel):
    title: str
    description: str
    due_date: date
    priority: str
    assigned_to: int


class TaskUpdate(BaseModel):
    title: str
    description: str
    due_date: date
    priority: str
    status: str
    assigned_to: int


class TaskResponse(BaseModel):
    id: int
    title: str
    description: str
    due_date: date
    priority: str
    status: str
    assigned_to: int
    created_at: datetime

    class Config:
        from_attributes = True