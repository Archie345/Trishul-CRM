from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    WebSocket,
    WebSocketDisconnect
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User

from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse
)

from app.services.task_service import (
    create_task,
    get_all_tasks,
    get_task_by_id,
    update_task,
    delete_task
)

from app.services.websocket_manager import (
    manager as notification_manager
)

from app.services.task_websocket_manager import (
    manager as task_manager
)


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


# =========================================================
# CREATE TASK
# =========================================================

@router.post(
    "/",
    response_model=TaskResponse
)
async def add_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    new_task, notification = create_task(
        db,
        task
    )

    # ---------------------------------------------
    # Personal notification
    # ---------------------------------------------

    await notification_manager.send_personal_notification(
        task.assigned_to,
        {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "is_read": notification.is_read,
            "created_at": (
                notification.created_at.isoformat()
                if notification.created_at
                else None
            )
        }
    )

    # ---------------------------------------------
    # Task page real-time update
    # ---------------------------------------------

    await task_manager.broadcast(
        {
            "event": "task_created",
            "task": TaskResponse.model_validate(
                new_task
            ).model_dump(
                mode="json"
            )
        }
    )

    return new_task


# =========================================================
# GET ALL TASKS
# =========================================================

@router.get(
    "/",
    response_model=list[TaskResponse]
)
def read_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    return get_all_tasks(db)


# =========================================================
# GET SINGLE TASK
# =========================================================

@router.get(
    "/{task_id}",
    response_model=TaskResponse
)
def read_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    task = get_task_by_id(
        db,
        task_id
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task


# =========================================================
# UPDATE TASK
# =========================================================

@router.put(
    "/{task_id}",
    response_model=TaskResponse
)
async def edit_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    task = update_task(
        db,
        task_id,
        task_data
    )

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # ---------------------------------------------
    # Real-time update
    # ---------------------------------------------

    await task_manager.broadcast(
        {
            "event": "task_updated",
            "task": TaskResponse.model_validate(
                task
            ).model_dump(
                mode="json"
            )
        }
    )

    return task


# =========================================================
# DELETE TASK
# =========================================================

@router.delete(
    "/{task_id}"
)
async def remove_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    )
):

    deleted = delete_task(
        db,
        task_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # ---------------------------------------------
    # Real-time delete
    # ---------------------------------------------

    await task_manager.broadcast(
        {
            "event": "task_deleted",
            "task_id": task_id
        }
    )

    return {
        "message": "Task deleted successfully"
    }


# =========================================================
# TASK WEBSOCKET
# =========================================================

@router.websocket("/ws")
async def tasks_websocket(
    websocket: WebSocket
):

    await task_manager.connect(
        websocket
    )

    try:

        while True:

            await websocket.receive_text()

    except WebSocketDisconnect:

        task_manager.disconnect(
            websocket
        )

    except Exception:

        task_manager.disconnect(
            websocket
        )