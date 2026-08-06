from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.lead import Lead
from app.models.customer import Customer
from app.models.task import Task

router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


@router.get("/overview")
def reports_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_leads = db.query(Lead).count()
    total_customers = db.query(Customer).count()
    total_tasks = db.query(Task).count()

    completed_tasks = (
        db.query(Task)
        .filter(Task.status == "Completed")
        .count()
    )

    pending_tasks = (
        db.query(Task)
        .filter(Task.status == "Pending")
        .count()
    )

    return {
        "total_leads": total_leads,
        "total_customers": total_customers,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks
    }


@router.get("/lead-status")
def lead_status_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = (
        db.query(
            Lead.status,
            func.count(Lead.id)
        )
        .group_by(Lead.status)
        .all()
    )

    return [
        {
            "status": status,
            "count": count
        }
        for status, count in result
    ]


@router.get("/task-status")
def task_status_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = (
        db.query(
            Task.status,
            func.count(Task.id)
        )
        .group_by(Task.status)
        .all()
    )

    return [
        {
            "status": status,
            "count": count
        }
        for status, count in result
    ]