from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.user import User

from app.schemas.lead import LeadCreate, LeadUpdate,  LeadResponse

from app.services.lead_service import (
    create_lead,
    get_all_leads,
    get_lead_by_id,
     update_lead,
     delete_lead
)

router = APIRouter(
    prefix="/leads",
    tags=["Leads"]
)


@router.post("/", response_model=LeadResponse)
def add_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "employee"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    return create_lead(
    db,
    lead,
    current_user.id
)

@router.get("/", response_model=list[LeadResponse])
def read_all_leads(
    name: str | None = None,
    status: str | None = None,
    company: str | None = None,
    
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_all_leads(
        db=db,
        name=name,
        status=status,
        company=company
        
    )

@router.get("/{lead_id}", response_model=LeadResponse)
def read_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = get_lead_by_id(db, lead_id)

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    return lead

@router.put("/{lead_id}", response_model=LeadResponse)
def edit_lead(
    lead_id: int,
    lead_data: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = update_lead(db, lead_id, lead_data)

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    return lead

@router.delete("/{lead_id}")
def remove_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted = delete_lead(db, lead_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    return {
        "message": "Lead deleted successfully"
    }