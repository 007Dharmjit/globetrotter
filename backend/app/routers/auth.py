import logging
import os
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import create_access_token, hash_password, verify_password
from ..database import get_db
from ..models import PasswordReset, User
from ..schemas import ForgotIn, ForgotOut, LoginIn, MessageOut, ResetIn, SignupIn, TokenOut

router = APIRouter(prefix="/api/auth", tags=["auth"])
log = logging.getLogger("globetrotter.auth")

RESET_MINUTES = 15
# Said whether or not the email is registered, so the form cannot be used to find accounts.
RESET_SENT = "If that email has an account, a reset link has been created for it."
RESET_DEAD = "This reset link has expired or has already been used. Ask for a new one."
DEACTIVATED = "This account is deactivated. Contact an administrator to get it back."


def reset_url(token: str) -> str:
    base = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").rstrip("/")
    return f"{base}/reset/{token}"


@router.post("/signup", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")

    user = User(name=payload.name, email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_access_token(user.id), user=user)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Same message either way so the form cannot be used to discover registered emails.
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Email or password is incorrect.")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, DEACTIVATED)

    return TokenOut(access_token=create_access_token(user.id), user=user)


@router.post("/forgot", response_model=ForgotOut)
def forgot_password(payload: ForgotIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None:
        return ForgotOut(message=RESET_SENT)

    # Asking again retires the previous link, so only the newest one opens the form.
    db.query(PasswordReset).filter(
        PasswordReset.user_id == user.id, PasswordReset.used.is_(False)
    ).update({"used": True})

    reset = PasswordReset(
        user_id=user.id,
        token=secrets.token_urlsafe(32)[:64],
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=RESET_MINUTES),
    )
    db.add(reset)
    db.commit()

    link = reset_url(reset.token)
    # The app runs offline with no mail service, so the link is logged and handed back instead.
    log.info("Password reset link for %s: %s", user.email, link)
    return ForgotOut(message=RESET_SENT, reset_link=link)


@router.post("/reset", response_model=MessageOut)
def reset_password(payload: ResetIn, db: Session = Depends(get_db)):
    reset = db.query(PasswordReset).filter(PasswordReset.token == payload.token).first()
    if reset is None or reset.used or reset.expires_at <= datetime.now(timezone.utc):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, RESET_DEAD)

    user = db.get(User, reset.user_id)
    if user is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, RESET_DEAD)

    user.password_hash = hash_password(payload.password)
    reset.used = True
    db.commit()
    return MessageOut(message="Your password has been changed. Log in with your new one.")
