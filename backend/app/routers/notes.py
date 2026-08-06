from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.services.lead_service import get_lead_by_id
from app.models.user import User

from app.schemas.note import (
    NoteCreate,
    NoteUpdate,
    NoteResponse
)

from app.services.note_service import (
    create_note,
    get_notes_by_lead,
    update_note,
    delete_note,
    get_note_by_id,
    get_all_notes
)

router = APIRouter(
    prefix="/notes",
    tags=["Notes"]
)


from app.services.lead_service import get_lead_by_id

@router.post("/{lead_id}", response_model=NoteResponse)
def add_note(
    lead_id: int,
    note: NoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = get_lead_by_id(db, lead_id)

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found"
        )

    return create_note(
        db=db,
        lead_id=lead_id,
        user_id=current_user.id,
        note=note
    )
@router.get("/", response_model=list[NoteResponse])
def read_all_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_all_notes(db)

@router.get("/{lead_id}", response_model=list[NoteResponse])
def read_notes(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_notes_by_lead(db, lead_id)


@router.put("/{note_id}", response_model=NoteResponse)
def edit_note(
    note_id: int,
    note_data: NoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = update_note(db, note_id, note_data)

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    return note


@router.delete("/{note_id}")
def remove_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted = delete_note(db, note_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    return {
        "message": "Note deleted successfully"
    }