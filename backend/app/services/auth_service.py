import firebase_admin
from firebase_admin import auth as firebase_auth

import secrets
from datetime import datetime, timedelta, timezone

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
    role=user.role
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

def create_password_reset_token(db: Session, email: str):
    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        return None

    token = secrets.token_urlsafe(32)

    user.reset_token = token
    user.reset_token_expires = (
        datetime.now(timezone.utc) + timedelta(minutes=30)
    )

    db.commit()
    db.refresh(user)

    return token

def reset_user_password(
    db: Session,
    token: str,
    new_password: str
):
    user = (
        db.query(User)
        .filter(User.reset_token == token)
        .first()
    )

    if not user:
        return None

    # Check token expiry
    if (
        not user.reset_token_expires
        or user.reset_token_expires < datetime.now(timezone.utc)
    ):
        return "expired"

    # Update password
    user.hashed_password = hash_password(new_password)

    # Invalidate reset token
    user.reset_token = None
    user.reset_token_expires = None

    db.commit()
    db.refresh(user)

    return user

def authenticate_google_user(db: Session, id_token: str):

    try:
        decoded_token = firebase_auth.verify_id_token(id_token)

    except Exception:
        return None

    email = decoded_token.get("email")
    name = decoded_token.get("name")
    uid = decoded_token.get("uid")

    if not email:
        return None

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Existing user
    if user:
        return user

    # New Google user
    random_password = hash_password(
        f"google-user-{uid}"
    )

    new_user = User(
        full_name=name or email.split("@")[0],
        email=email,
        hashed_password=random_password,
        role="employee"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user