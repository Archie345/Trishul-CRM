from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Text,
    Numeric
)
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(100),
        nullable=True
    )

    phone = Column(
        String(20),
        nullable=True
    )

    company = Column(
        String(100),
        nullable=True
    )

    # NEW
    service = Column(
        String(150),
        nullable=True
    )

    # NEW
    value = Column(
        Numeric(12, 2),
        default=0,
        nullable=False
    )

    # NEW
    timeline = Column(
        String(100),
        nullable=True
    )

    # NEW
    notes = Column(
        Text,
        nullable=True
    )

    status = Column(
        String(50),
        default="Future Service Interest",
        nullable=False
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    employee = relationship(
        "User",
        foreign_keys=[assigned_to]
    )