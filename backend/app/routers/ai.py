from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.lead import Lead

router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)


@router.get("/next-action/{lead_id}")
def suggest_next_action(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        return {"message": "Lead not found"}

    suggestions = {
        "New": "Schedule an introductory call with the customer.",
        "Contacted": "Send a follow-up email within 24 hours.",
        "Qualified": "Arrange a product demo.",
        "Lost": "Re-engage after 30 days with a special offer."
    }

    return {
        "lead": lead.name,
        "status": lead.status,
        "next_action": suggestions.get(
            lead.status,
            "Follow up with the customer."
        )
    }