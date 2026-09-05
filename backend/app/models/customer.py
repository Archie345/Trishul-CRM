from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(20))
    company = Column(String(100))
    address = Column(String(255), default="")
    
    revenue = Column(Integer, default=0, nullable=False)

    status = Column(
        String(20),
        default="Active"
    )

    # Customer can now be created directly,
    # so lead_id is optional.
    lead_id = Column(
        Integer,
        ForeignKey("leads.id"),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    lead = relationship("Lead")