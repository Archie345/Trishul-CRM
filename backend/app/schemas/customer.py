from pydantic import BaseModel
from datetime import datetime


class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: str = ""
    company: str = ""
    address: str = ""
    status: str = "Active"
    revenue: int = 0


class CustomerUpdate(BaseModel):
    name: str
    email: str
    phone: str
    company: str
    address: str
    status: str
    revenue: int = 0


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    company: str | None
    address: str | None
    status: str
    revenue: int
    lead_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True