from pydantic import BaseModel
from datetime import datetime


class CustomerCreate(BaseModel):
    address: str = ""


class CustomerUpdate(BaseModel):
    name: str
    email: str
    phone: str
    company: str
    address: str
    status: str


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    company: str
    address: str
    status: str
    lead_id: int
    created_at: datetime

    class Config:
        from_attributes = True