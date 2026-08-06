from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate
from app.utils.security import hash_password, verify_password

def create_user(db: Session, user: UserCreate):
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        return None

    new_user = User(
        full_name=user.full_name,
        email=user.email,
        hashed_password=hash_password(user.password),
        role="employee" 
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

def authenticate_user(db: Session, email: str, password: str):
    print(f"Email entered: {email}")

    user = db.query(User).filter(User.email == email).first()

    print(f"User found: {user}")

    if not user:
        print("User does not exist")
        return None

    print(f"Stored hash: {user.hashed_password}")

    password_matches = verify_password(password, user.hashed_password)
    print(f"Password matches: {password_matches}")

    if not password_matches:
        return None

    return user