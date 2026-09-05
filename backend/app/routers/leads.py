from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user

from app.models.user import User
from app.schemas.lead import (
    LeadCreate,
    LeadUpdate,
    LeadResponse,
)

from app.services.lead_service import (
    create_lead,
    get_all_leads,
    get_lead_by_id,
    update_lead,
    delete_lead,
)

from app.services.websocket_manager import manager

from app.services.lead_websocket_manager import (
    manager as lead_manager,
)

from app.services.dashboard_websocket_manager import (
    manager as dashboard_manager,
)

from app.routers.reports import build_dashboard_data


router = APIRouter(
    prefix="/leads",
    tags=["Leads"],
)


# =========================================================
# WEBSOCKET
# =========================================================

@router.websocket("/ws")
async def leads_websocket(
    websocket: WebSocket,
):
    await lead_manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        lead_manager.disconnect(websocket)

    except Exception:
        lead_manager.disconnect(websocket)


# =========================================================
# CREATE LEAD
# =========================================================

@router.post(
    "/",
    response_model=LeadResponse,
)
async def add_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role not in [
        "admin",
        "employee",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    new_lead, notification = create_lead(
        db=db,
        lead=lead,
        assigned_to=current_user.id,
    )

    # -----------------------------------------
    # Personal notification
    # -----------------------------------------

    await manager.send_personal_notification(
        current_user.id,
        {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "notification_type": (
                notification.notification_type
            ),
            "is_read": notification.is_read,
            "created_at": (
                notification.created_at.isoformat()
                if notification.created_at
                else None
            ),
        },
    )

    # -----------------------------------------
    # Lead WebSocket
    # -----------------------------------------

    lead_response = LeadResponse.model_validate(
        new_lead
    )

    await lead_manager.broadcast(
        {
            "event": "lead_created",
            "lead": lead_response.model_dump(
                mode="json"
            ),
        }
    )

    # -----------------------------------------
    # Dashboard WebSocket
    # -----------------------------------------

    await dashboard_manager.broadcast(
        {
            "event": "dashboard_updated",
            **build_dashboard_data(db),
        }
    )

    return new_lead


# =========================================================
# GET ALL LEADS
# =========================================================

@router.get(
    "/",
    response_model=list[LeadResponse],
)
def read_all_leads(
    name: str | None = None,
    status: str | None = None,
    company: str | None = None,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    return get_all_leads(
        db=db,
        name=name,
        status=status,
        company=company,
    )


# =========================================================
# GET SINGLE LEAD
# =========================================================

@router.get(
    "/{lead_id}",
    response_model=LeadResponse,
)
def read_lead(
    lead_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    lead = get_lead_by_id(
        db,
        lead_id,
    )

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    return lead


# =========================================================
# UPDATE LEAD
# =========================================================

@router.put(
    "/{lead_id}",
    response_model=LeadResponse,
)
async def edit_lead(
    lead_id: int,

    lead_data: LeadUpdate,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    if current_user.role not in [
        "admin",
        "employee",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    lead = update_lead(
        db,
        lead_id,
        lead_data,
    )

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    # -----------------------------------------
    # Lead WebSocket
    # -----------------------------------------

    lead_response = LeadResponse.model_validate(
        lead
    )

    await lead_manager.broadcast(
        {
            "event": "lead_updated",
            "lead": lead_response.model_dump(
                mode="json"
            ),
        }
    )

    # -----------------------------------------
    # Dashboard WebSocket
    # -----------------------------------------

    await dashboard_manager.broadcast(
        {
            "event": "dashboard_updated",
            **build_dashboard_data(db),
        }
    )

    return lead


# =========================================================
# DELETE LEAD
# =========================================================

@router.delete(
    "/{lead_id}",
)
async def remove_lead(
    lead_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    if current_user.role not in [
        "admin",
        "employee",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized",
        )

    deleted = delete_lead(
        db,
        lead_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Lead not found",
        )

    # -----------------------------------------
    # Lead WebSocket
    # -----------------------------------------

    await lead_manager.broadcast(
        {
            "event": "lead_deleted",
            "lead_id": lead_id,
        }
    )

    # -----------------------------------------
    # Dashboard WebSocket
    # -----------------------------------------

    await dashboard_manager.broadcast(
        {
            "event": "dashboard_updated",
            **build_dashboard_data(db),
        }
    )

    return {
        "message": "Lead deleted successfully"
    }