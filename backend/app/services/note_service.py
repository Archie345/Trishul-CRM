from sqlalchemy.orm import Session

from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate


def create_note(
    db: Session,
    lead_id: int,
    user_id: int,
    note: NoteCreate
):
    new_note = Note(
        content=note.content,
        lead_id=lead_id,
        user_id=user_id
    )

    db.add(new_note)
    db.commit()
    db.refresh(new_note)

    return new_note


def get_notes_by_lead(
    db: Session,
    lead_id: int
):
    return (
        db.query(Note)
        .filter(Note.lead_id == lead_id)
        .order_by(Note.created_at.desc())
        .all()
    )
def get_all_notes(db: Session):
    return (
        db.query(Note)
        .order_by(Note.created_at.desc())
        .all()
    )


def get_note_by_id(
    db: Session,
    note_id: int
):
    return (
        db.query(Note)
        .filter(Note.id == note_id)
        .first()
    )


def update_note(
    db: Session,
    note_id: int,
    note_data: NoteUpdate
):
    note = get_note_by_id(db, note_id)

    if not note:
        return None

    note.content = note_data.content

    db.commit()
    db.refresh(note)

    return note


def delete_note(
    db: Session,
    note_id: int
):
    note = get_note_by_id(db, note_id)

    if not note:
        return False

    db.delete(note)
    db.commit()

    return True