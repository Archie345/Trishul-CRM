from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class LeadBase(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None

    service: str | None = None
    value: Decimal = Decimal("0")
    timeline: str | None = None
    notes: str | None = None

    status: str = "Future Service Interest"


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None

    service: str | None = None
    value: Decimal = Decimal("0")
    timeline: str | None = None
    notes: str | None = None

    status: str

    model_config = ConfigDict(
        from_attributes=True
    )


class LeadResponse(BaseModel):
    id: int

    name: str
    email: str | None = None
    phone: str | None = None
    company: str | None = None

    service: str | None = None
    value: Decimal = Decimal("0")
    timeline: str | None = None
    notes: str | None = None

    status: str

    assigned_to: int | None = None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )