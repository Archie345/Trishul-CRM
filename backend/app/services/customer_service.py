from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.lead import Lead

from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate
)


def create_customer(
    db: Session,
    customer_data: CustomerCreate
):
    customer = Customer(
        name=customer_data.name,
        email=customer_data.email,
        phone=customer_data.phone,
        company=customer_data.company,
        address=customer_data.address,
        status=customer_data.status,
        revenue=customer_data.revenue,
        lead_id=None
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


def convert_lead_to_customer(db: Session, lead_id: int):
    lead = db.query(Lead).filter(
        Lead.id == lead_id
    ).first()

    if not lead:
        return None

    if lead.status != "Qualified":
        return "not_qualified"

    existing_customer = (
        db.query(Customer)
        .filter(Customer.lead_id == lead_id)
        .first()
    )

    if existing_customer:
        return "already_exists"

    customer = Customer(
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        company=lead.company,
        lead_id=lead.id
    )

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


def get_all_customers(db: Session):
    return db.query(Customer).all()


def get_customer(
    db: Session,
    customer_id: int
):
    return (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )


def update_customer(
    db: Session,
    customer_id: int,
    customer_data: CustomerUpdate
):
    customer = get_customer(db, customer_id)

    if not customer:
        return None

    customer.name = customer_data.name
    customer.email = customer_data.email
    customer.phone = customer_data.phone
    customer.company = customer_data.company
    customer.address = customer_data.address
    customer.status = customer_data.status

    db.commit()
    db.refresh(customer)

    return customer


def delete_customer(
    db: Session,
    customer_id: int
):
    customer = get_customer(db, customer_id)

    if not customer:
        return False

    db.delete(customer)
    db.commit()

    return True