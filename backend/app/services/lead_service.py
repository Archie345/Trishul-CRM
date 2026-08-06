from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.schemas.lead import LeadCreate


def create_lead(
    db: Session,
    lead: LeadCreate,
    assigned_to: int
):
    new_lead = Lead(
        name=lead.name,
        email=lead.email,
        phone=lead.phone,
        company=lead.company,
        status=lead.status,
        assigned_to=assigned_to
    )
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    return new_lead

def get_all_leads(
    db: Session,
    name: str = None,
    status: str = None,
    company: str = None,
):
    query = db.query(Lead)

    if name:
        query = query.filter(
            Lead.name.ilike(f"%{name}%")
        )

    if status:
        query = query.filter(
            Lead.status == status
        )

    if company:
        query = query.filter(
            Lead.company.ilike(f"%{company}%")
        )

    return query.all()

    return query.offset(skip).limit(limit).all()

def get_lead_by_id(db: Session, lead_id: int):
    return db.query(Lead).filter(Lead.id == lead_id).first()

def update_lead(db: Session, lead_id: int, lead_data):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        return None

    lead.name = lead_data.name
    lead.email = lead_data.email
    lead.phone = lead_data.phone
    lead.company = lead_data.company
    lead.status = lead_data.status

    db.commit()
    db.refresh(lead)

    return lead

def delete_lead(db: Session, lead_id: int):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        return None

    db.delete(lead)
    db.commit()

    return True