from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

from app.schemas.customer import (
    CustomerResponse,
    CustomerUpdate
)

from app.services.customer_service import (
    convert_lead_to_customer,
    get_all_customers,
    get_customer,
    update_customer,
    delete_customer
)

router = APIRouter(
    prefix="/customers",
    tags=["Customers"]
)


@router.post("/convert/{lead_id}", response_model=CustomerResponse)
def convert_customer(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = convert_lead_to_customer(db, lead_id)

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    if customer == "not_qualified":
        raise HTTPException(
            status_code=400,
            detail="Lead must be Qualified before conversion"
        )

    if customer == "already_exists":
        raise HTTPException(
            status_code=400,
            detail="Customer already exists"
        )

    return customer


@router.get("/", response_model=list[CustomerResponse])
def read_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_all_customers(db)


@router.get("/{customer_id}", response_model=CustomerResponse)
def read_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = get_customer(db, customer_id)

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def edit_customer(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = update_customer(
        db,
        customer_id,
        customer_data
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return customer


@router.delete("/{customer_id}")
def remove_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted = delete_customer(
        db,
        customer_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return {
        "message": "Customer deleted successfully"
    }