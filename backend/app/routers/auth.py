from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

import app.firebase_config

from app.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import (
    create_user,
    authenticate_user,
    authenticate_google_user,
    create_password_reset_token,
     reset_user_password
)
from app.utils.email import send_password_reset_email
from app.dependencies import get_current_user
from app.models.user import User

from app.schemas.token import (
    Token,
    GoogleLoginRequest,
    ResetPasswordRequest
)

from app.utils.security import create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=UserResponse)
def register(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    new_user = create_user(db, user)

    if not new_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return new_user


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(
        db,
        form_data.username,
        form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/forgot-password")
def forgot_password(
    email: str,
    db: Session = Depends(get_db)
):
    token = create_password_reset_token(db, email)

    if not token:
        raise HTTPException(
            status_code=404,
            detail="No account found with this email"
        )

    try:
        send_password_reset_email(
            recipient_email=email,
            reset_token=token
        )

    except Exception as error:
        print("Email sending error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to send password reset email"
        )

    return {
        "message": "Password reset link has been sent to your email."
    }

@router.post("/reset-password")
def reset_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    result = reset_user_password(
        db,
        data.token,
        data.new_password
    )

    if result is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid password reset token"
        )

    if result == "expired":
        raise HTTPException(
            status_code=400,
            detail="Password reset token has expired"
        )

    return {
        "message": "Password reset successfully"
    }

@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.post("/google-login", response_model=Token)
def google_login(
    data: GoogleLoginRequest,
    db: Session = Depends(get_db)
):
    user = authenticate_google_user(
        db,
        data.id_token
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google authentication"
        )

    access_token = create_access_token(
        data={"sub": user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }