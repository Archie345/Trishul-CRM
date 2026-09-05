from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func
from jose import JWTError, jwt

from app.database import get_db, SessionLocal
from app.dependencies import get_current_user
from app.config import SECRET_KEY, ALGORITHM

from app.models.user import User
from app.models.lead import Lead
from app.models.customer import Customer
from app.models.task import Task

from app.services.dashboard_websocket_manager import manager


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


# =========================================================
# BUILD LIVE DASHBOARD DATA
# =========================================================

def build_dashboard_data(db: Session):

    # -----------------------------------------------------
    # EMPLOYEES
    # -----------------------------------------------------

    total_employees = (
        db.query(User)
        .filter(User.role == "employee")
        .count()
    )

    # -----------------------------------------------------
    # LEADS
    # -----------------------------------------------------

    total_leads = db.query(Lead).count()

    # -----------------------------------------------------
    # CUSTOMERS
    # -----------------------------------------------------

    total_customers = db.query(Customer).count()

    # -----------------------------------------------------
    # TASKS
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # CONVERSION
    # -----------------------------------------------------

    if total_leads > 0:
        conversion_rate = round(
            (total_customers / total_leads) * 100,
            1
        )
    else:
        conversion_rate = 0

    # -----------------------------------------------------
    # REVENUE
    # -----------------------------------------------------

    revenue = (
        db.query(
            func.coalesce(
                func.sum(Customer.revenue),
                0
            )
        )
        .scalar()
    )

    # -----------------------------------------------------
    # LATEST CUSTOMERS
    # -----------------------------------------------------

    latest_customers = (
        db.query(Customer)
        .order_by(Customer.created_at.desc())
        .limit(5)
        .all()
    )

    latest_customers_data = []

    for customer in latest_customers:

        latest_customers_data.append({
            "id": customer.id,
            "name": customer.name,
            "company": customer.company,
            "status": customer.status,
            "created_at": (
                customer.created_at.isoformat()
                if customer.created_at
                else None
            )
        })

    # -----------------------------------------------------
    # RECENT ACTIVITY
    # -----------------------------------------------------

    activities = []

    # Latest Leads
    latest_leads = (
        db.query(Lead)
        .order_by(Lead.created_at.desc())
        .limit(5)
        .all()
    )

    for lead in latest_leads:

        activities.append({
            "type": "lead",
            "message": f"New lead added: {lead.name}",
            "created_at": (
                lead.created_at.isoformat()
                if lead.created_at
                else None
            ),
            "_sort_date": lead.created_at
        })

    # Latest Customers
    for customer in latest_customers:

        activities.append({
            "type": "customer",
            "message": f"Customer converted: {customer.name}",
            "created_at": (
                customer.created_at.isoformat()
                if customer.created_at
                else None
            ),
            "_sort_date": customer.created_at
        })

    # Latest Tasks
    latest_tasks = (
        db.query(Task)
        .order_by(Task.created_at.desc())
        .limit(5)
        .all()
    )

    for task in latest_tasks:

        if task.status == "Completed":
            message = f"Task completed: {task.title}"
        else:
            message = f"New task created: {task.title}"

        activities.append({
            "type": "task",
            "message": message,
            "created_at": (
                task.created_at.isoformat()
                if task.created_at
                else None
            ),
            "_sort_date": task.created_at
        })

    # Sort newest first
    activities.sort(
        key=lambda x: x["_sort_date"] or "",
        reverse=True
    )

    recent_activity = []

    for activity in activities[:5]:

        recent_activity.append({
            "type": activity["type"],
            "message": activity["message"],
            "created_at": activity["created_at"]
        })

    # -----------------------------------------------------
    # RETURN LIVE DASHBOARD DATA
    # -----------------------------------------------------

    return {
        # Main dashboard values
        "employees": total_employees,
        "leads": total_leads,
        "customers": total_customers,
        "tasks": total_tasks,

        # Task details
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,

        # Financial
        "revenue": float(revenue or 0),

        # Conversion
        "conversion": conversion_rate,

        # Backward-compatible names
        "total_leads": total_leads,
        "total_customers": total_customers,
        "total_tasks": total_tasks,

        # Lists
        "latest_customers": latest_customers_data,
        "recent_activity": recent_activity
    }


# =========================================================
# BUILD EXECUTIVE REPORT DATA
# =========================================================

def build_executive_report(db: Session):

    # -----------------------------------------------------
    # OVERVIEW
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # LEAD STATUS
    # -----------------------------------------------------

    lead_status_result = (
        db.query(
            Lead.status,
            func.count(Lead.id)
        )
        .group_by(Lead.status)
        .all()
    )

    lead_status = [
        {
            "status": status,
            "count": count
        }
        for status, count in lead_status_result
    ]

    # -----------------------------------------------------
    # TASK STATUS
    # -----------------------------------------------------

    task_status_result = (
        db.query(
            Task.status,
            func.count(Task.id)
        )
        .group_by(Task.status)
        .all()
    )

    task_status = [
        {
            "status": status,
            "count": count
        }
        for status, count in task_status_result
    ]

    # -----------------------------------------------------
    # PIPELINE VALUE
    # -----------------------------------------------------

    pipeline_value = (
        db.query(
            func.coalesce(
                func.sum(Lead.value),
                0
            )
        )
        .scalar()
    )

    # -----------------------------------------------------
    # WON REVENUE
    # -----------------------------------------------------

    won_revenue = (
        db.query(
            func.coalesce(
                func.sum(Lead.value),
                0
            )
        )
        .filter(
            Lead.status.in_(["Booked", "Converted"])
        )
        .scalar()
    )

    # -----------------------------------------------------
    # ACTIVE LEADS
    # -----------------------------------------------------

    active_leads = (
        db.query(Lead)
        .filter(
            ~Lead.status.in_(
                ["Lost", "Booked", "Converted"]
            )
        )
        .count()
    )

    # -----------------------------------------------------
    # CONVERSION
    # -----------------------------------------------------

    if total_leads > 0:
        conversion_rate = round(
            (total_customers / total_leads) * 100,
            1
        )
    else:
        conversion_rate = 0

    # -----------------------------------------------------
    # TASK FULFILLMENT
    # -----------------------------------------------------

    if total_tasks > 0:
        task_fulfillment = round(
            (completed_tasks / total_tasks) * 100,
            1
        )
    else:
        task_fulfillment = 0

    # -----------------------------------------------------
    # RETURN
    # -----------------------------------------------------

    return {

        "overview": {
            "total_leads": total_leads,
            "total_customers": total_customers,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
        },

        "pipeline": {
            "pipeline_value": float(
                pipeline_value or 0
            ),
            "won_revenue": float(
                won_revenue or 0
            ),
            "active_leads": active_leads,
            "conversion_rate": conversion_rate,
        },

        "task_fulfillment": task_fulfillment,

        "lead_status": lead_status,

        "task_status": task_status,
    }


# =========================================================
# EXECUTIVE REPORT API
# =========================================================

@router.get("/executive")
def executive_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return build_executive_report(db)


# =========================================================
# OVERVIEW API
# =========================================================

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


# =========================================================
# LEAD STATUS API
# =========================================================

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


# =========================================================
# TASK STATUS API
# =========================================================

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


# =========================================================
# DASHBOARD LIVE API
# =========================================================

@router.get("/dashboard-live")
def dashboard_live(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return build_dashboard_data(db)


# =========================================================
# DASHBOARD WEBSOCKET
# =========================================================

@router.websocket("/ws")
async def dashboard_websocket(
    websocket: WebSocket
):

    # -----------------------------------------------------
    # GET TOKEN
    # -----------------------------------------------------

    token = websocket.query_params.get("token")

    if not token:

        await websocket.close(code=1008)

        return

    # -----------------------------------------------------
    # VERIFY TOKEN
    # -----------------------------------------------------

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if not email:

            await websocket.close(code=1008)

            return

    except JWTError:

        await websocket.close(code=1008)

        return

    # -----------------------------------------------------
    # VERIFY USER + GET INITIAL DATA
    # -----------------------------------------------------

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(User.email == email)
            .first()
        )

        if not user:

            await websocket.close(code=1008)

            return

        initial_data = build_dashboard_data(db)

    finally:

        db.close()

    # -----------------------------------------------------
    # CONNECT
    # -----------------------------------------------------

    await manager.connect(websocket)

    # -----------------------------------------------------
    # SEND INITIAL DATA
    # -----------------------------------------------------

    await websocket.send_json(initial_data)

    # -----------------------------------------------------
    # KEEP CONNECTION ALIVE
    # -----------------------------------------------------

    try:

        while True:

            await websocket.receive_text()

    except WebSocketDisconnect:

        manager.disconnect(websocket)

    except Exception:

        manager.disconnect(websocket)