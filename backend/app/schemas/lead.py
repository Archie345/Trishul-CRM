from pydantic import BaseModel
from datetime import datetime


class LeadCreate(BaseModel):
    name: str
    email: str
    phone: str
    company: str
    status: str = "New"


class LeadResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    company: str
    status: str
    assigned_to: int
    created_at: datetime

class LeadUpdate(BaseModel):
    name: str
    email: str
    phone: str
    company: str
    status: str

    class Config:
        from_attributes = True