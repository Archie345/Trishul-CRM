from sqlalchemy.orm import Session
from app.models.user import User


def get_all_users(db: Session):
    return db.query(User).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user_id: int, full_name: str, email: str, role: str):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return None

    user.full_name = full_name
    user.email = email
    user.role = role

    db.commit()
    db.refresh(user)

    return user


def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return False

    db.delete(user)
    db.commit()

    return True