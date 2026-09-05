import os

import google.generativeai as genai

from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect
)

from sqlalchemy.orm import Session
from sqlalchemy import func

from pydantic import BaseModel

from jose import JWTError, jwt

from app.database import get_db, SessionLocal
from app.dependencies import get_current_user
from app.config import SECRET_KEY, ALGORITHM

from app.models.user import User
from app.models.lead import Lead
from app.models.customer import Customer
from app.models.task import Task


router = APIRouter(
    prefix="/ai",
    tags=["AI Assistant"]
)


# =========================================================
# GEMINI
# =========================================================

genai.configure(
    api_key=os.getenv("GEMINI_API_KEY")
)

model = genai.GenerativeModel(
    "gemini-flash-latest"
)


# =========================================================
# REQUEST MODEL
# =========================================================

class AIQuestion(BaseModel):
    question: str


# =========================================================
# BUILD CRM CONTEXT
# =========================================================

def build_crm_context(db: Session):

    # -----------------------------------------------------
    # COUNTS
    # -----------------------------------------------------

    total_employees = (
        db.query(User)
        .filter(User.role == "employee")
        .count()
    )

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
    # PIPELINE
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
            Lead.status.in_(
                ["Booked", "Converted"]
            )
        )
        .scalar()
    )

    # -----------------------------------------------------
    # INACTIVE CLIENTS
    # -----------------------------------------------------

    inactive_clients = (
        db.query(Customer)
        .filter(
            Customer.status.in_(
                ["Inactive", "Dormant"]
            )
        )
        .count()
    )

    # -----------------------------------------------------
    # LEADS
    # -----------------------------------------------------

    latest_leads = (
        db.query(Lead)
        .order_by(
            Lead.created_at.desc()
        )
        .limit(10)
        .all()
    )

    leads_data = []

    for lead in latest_leads:

        leads_data.append({
            "id": lead.id,
            "name": lead.name,
            "email": lead.email,
            "phone": lead.phone,
            "company": lead.company,
            "status": lead.status,
            "value": float(
                lead.value or 0
            )
        })

    # -----------------------------------------------------
    # CUSTOMERS
    # -----------------------------------------------------

    latest_customers = (
        db.query(Customer)
        .order_by(
            Customer.created_at.desc()
        )
        .limit(10)
        .all()
    )

    customers_data = []

    for customer in latest_customers:

        customers_data.append({
            "id": customer.id,
            "name": customer.name,
            "company": customer.company,
            "status": customer.status,
            "revenue": float(
                customer.revenue or 0
            )
        })

    # -----------------------------------------------------
    # TASKS
    # -----------------------------------------------------

    latest_tasks = (
        db.query(Task)
        .order_by(
            Task.created_at.desc()
        )
        .limit(10)
        .all()
    )

    tasks_data = []

    for task in latest_tasks:

        tasks_data.append({
            "id": task.id,
            "title": task.title,
            "status": task.status
        })

    # -----------------------------------------------------
    # RETURN
    # -----------------------------------------------------

    return {

        "employees": total_employees,

        "leads": total_leads,

        "customers": total_customers,

        "tasks": total_tasks,

        "completed_tasks": completed_tasks,

        "pending_tasks": pending_tasks,

        "pipeline_value": float(
            pipeline_value or 0
        ),

        "won_revenue": float(
            won_revenue or 0
        ),

        "inactive_clients": inactive_clients,

        "latest_leads": leads_data,

        "latest_customers": customers_data,

        "latest_tasks": tasks_data
    }


# =========================================================
# DASHBOARD CONTEXT
# =========================================================

@router.get("/dashboard-context")
def dashboard_context(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    return build_crm_context(db)


# =========================================================
# GENERAL AI CHAT
# =========================================================

@router.post("/chat")
def chat_ai(
    data: AIQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    question = data.question.strip()

    if not question:

        return {
            "message": "Question cannot be empty"
        }

    # -----------------------------------------------------
    # GET LIVE CRM DATA
    # -----------------------------------------------------

    context = build_crm_context(db)

    # -----------------------------------------------------
    # GEMINI PROMPT
    # -----------------------------------------------------

    prompt = f"""
You are Trishul AI, an enterprise AI assistant
inside a CRM system.

You have LIVE access to the CRM data below.

CRM OVERVIEW:

Employees:
{context["employees"]}

Total Leads:
{context["leads"]}

Customers:
{context["customers"]}

Total Tasks:
{context["tasks"]}

Completed Tasks:
{context["completed_tasks"]}

Pending Tasks:
{context["pending_tasks"]}

Pipeline Value:
₹{context["pipeline_value"]}

Won Revenue:
₹{context["won_revenue"]}

Inactive Clients:
{context["inactive_clients"]}


LATEST LEADS:

{context["latest_leads"]}


LATEST CUSTOMERS:

{context["latest_customers"]}


LATEST TASKS:

{context["latest_tasks"]}


USER QUESTION:

{question}


IMPORTANT RULES:

1. Answer using the CRM information above.
2. Never invent CRM numbers.
3. If data is unavailable, clearly say that.
4. Give practical business recommendations.
5. Be concise but useful.
6. If asked for an email, write a personalized professional email.
7. If asked for sales strategy, provide actionable steps.
8. If asked for a summary, summarize the actual CRM.
9. If asked about leads, use the actual leads provided.
10. If asked about tasks, use the actual task information.
11. If asked about pipeline, use the actual pipeline value.
12. Act like an enterprise CRM assistant.

Return a clear professional answer.
"""

    try:

        response = model.generate_content(
            prompt
        )

        return {
            "answer": response.text,
            "context": context
        }

    except Exception as e:

        print(
            "Gemini error:",
            str(e)
        )

        return {
            "answer":
                "Unable to generate AI response.",
            "error": str(e),
            "context": context
        }


# =========================================================
# EXISTING NEXT ACTION
# =========================================================

@router.get("/next-action/{lead_id}")
def suggest_next_action(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    lead = (
        db.query(Lead)
        .filter(
            Lead.id == lead_id
        )
        .first()
    )

    if not lead:

        return {
            "message": "Lead not found"
        }

    prompt = f"""
You are an AI assistant inside Trishul CRM.

Analyze this lead.

Name:
{lead.name}

Email:
{lead.email}

Phone:
{lead.phone}

Company:
{lead.company}

Status:
{lead.status}

Value:
₹{lead.value or 0}

Give:

1. Recommended next action
2. Why this action is appropriate
3. Suggested follow-up timing

Keep it concise and professional.
"""

    try:

        response = model.generate_content(
            prompt
        )

        return {
            "lead": lead.name,
            "status": lead.status,
            "next_action": response.text
        }

    except Exception as e:

        return {
            "lead": lead.name,
            "status": lead.status,
            "next_action":
                "Unable to generate AI recommendation.",
            "error": str(e)
        }


# =========================================================
# EXISTING LEAD CHAT
# =========================================================

@router.post("/ask/{lead_id}")
def ask_ai(
    lead_id: int,
    data: AIQuestion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    lead = (
        db.query(Lead)
        .filter(
            Lead.id == lead_id
        )
        .first()
    )

    if not lead:

        return {
            "message": "Lead not found"
        }

    question = data.question.strip()

    if not question:

        return {
            "message":
                "Question cannot be empty"
        }

    prompt = f"""
You are the AI Assistant inside Trishul CRM.

Lead information:

Name:
{lead.name}

Email:
{lead.email}

Phone:
{lead.phone}

Company:
{lead.company}

Status:
{lead.status}

Value:
₹{lead.value or 0}

User question:

{question}

Answer specifically using this lead information.

If the user asks for an email,
write a personalized professional email.

If the user asks for strategy,
give practical sales steps.

Do not invent information.
"""

    try:

        response = model.generate_content(
            prompt
        )

        return {
            "lead": lead.name,
            "question": question,
            "answer": response.text
        }

    except Exception as e:

        return {
            "lead": lead.name,
            "question": question,
            "answer":
                "Unable to generate AI response.",
            "error": str(e)
        }


# =========================================================
# AI WEBSOCKET
# =========================================================

@router.websocket("/ws")
async def ai_websocket(
    websocket: WebSocket
):

    token = websocket.query_params.get(
        "token"
    )

    if not token:

        await websocket.close(
            code=1008
        )

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

            await websocket.close(
                code=1008
            )

            return

    except JWTError:

        await websocket.close(
            code=1008
        )

        return

    # -----------------------------------------------------
    # DATABASE
    # -----------------------------------------------------

    db = SessionLocal()

    try:

        user = (
            db.query(User)
            .filter(
                User.email == email
            )
            .first()
        )

        if not user:

            await websocket.close(
                code=1008
            )

            return

        context = build_crm_context(db)

    finally:

        db.close()

    # -----------------------------------------------------
    # CONNECT
    # -----------------------------------------------------

    await websocket.accept()

    # -----------------------------------------------------
    # SEND INITIAL DATA
    # -----------------------------------------------------

    await websocket.send_json({
        "type": "crm_context",
        "data": context
    })

    # -----------------------------------------------------
    # KEEP CONNECTION ALIVE
    # -----------------------------------------------------

    try:

        while True:

            message = await websocket.receive_text()

            # Client can request fresh CRM data
            if message == "refresh":

                db = SessionLocal()

                try:

                    fresh_context = (
                        build_crm_context(db)
                    )

                finally:

                    db.close()

                await websocket.send_json({
                    "type": "crm_context",
                    "data": fresh_context
                })

    except WebSocketDisconnect:

        print(
            "AI WebSocket disconnected"
        )

    except Exception as e:

        print(
            "AI WebSocket error:",
            str(e)
        )