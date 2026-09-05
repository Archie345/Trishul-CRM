from sqlalchemy.orm import Session

from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadUpdate
from app.services.notification_service import create_notification


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
        service=lead.service,
        value=lead.value,
        timeline=lead.timeline,
        notes=lead.notes,
        status=lead.status,
        assigned_to=assigned_to
    )

    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)

    notification = create_notification(
        db=db,
        user_id=assigned_to,
        title="New Lead Added",
        message=f"New lead '{new_lead.name}' has been added.",
        notification_type="lead"
    )

    return new_lead, notification


def get_all_leads(
    db: Session,
    name: str | None = None,
    status: str | None = None,
    company: str | None = None
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

    return (
        query
        .order_by(Lead.created_at.desc())
        .all()
    )


def get_lead_by_id(
    db: Session,
    lead_id: int
):
    return (
        db.query(Lead)
        .filter(Lead.id == lead_id)
        .first()
    )


def update_lead(
    db: Session,
    lead_id: int,
    lead_data: LeadUpdate
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id)
        .first()
    )

    if not lead:
        return None

    lead.name = lead_data.name
    lead.email = lead_data.email
    lead.phone = lead_data.phone
    lead.company = lead_data.company

    lead.service = lead_data.service
    lead.value = lead_data.value
    lead.timeline = lead_data.timeline
    lead.notes = lead_data.notes

    lead.status = lead_data.status

    db.commit()
    db.refresh(lead)

    return lead


def delete_lead(
    db: Session,
    lead_id: int
):
    lead = (
        db.query(Lead)
        .filter(Lead.id == lead_id)
        .first()
    )

    if not lead:
        return None

    db.delete(lead)
    db.commit()

    return True