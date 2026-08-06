from sqlalchemy.orm import Session

from app.models.lead import Lead


def get_dashboard_stats(db: Session):
    total_leads = db.query(Lead).count()

    new_leads = db.query(Lead).filter(
        Lead.status == "New"
    ).count()

    contacted_leads = db.query(Lead).filter(
        Lead.status == "Contacted"
    ).count()

    qualified_leads = db.query(Lead).filter(
        Lead.status == "Qualified"
    ).count()

    lost_leads = db.query(Lead).filter(
        Lead.status == "Lost"
    ).count()

    return {
        "total_leads": total_leads,
        "new_leads": new_leads,
        "contacted_leads": contacted_leads,
        "qualified_leads": qualified_leads,
        "lost_leads": lost_leads,
    }