import os
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Trip, User
from ..schemas import ShareOut, TripDetail

router = APIRouter(tags=["share"])


def share_url(token: str) -> str:
    base = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").rstrip("/")
    return f"{base}/share/{token}"


@router.post("/api/trips/{trip_id}/share", response_model=ShareOut)
def share_trip(trip_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That trip does not exist.")
    if trip.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This trip belongs to another traveller.")

    # Sharing twice keeps the same link so anyone who already has it is not cut off.
    if not trip.share_token:
        trip.share_token = secrets.token_urlsafe(16)[:32]
    trip.is_public = True
    db.commit()
    db.refresh(trip)

    return ShareOut(is_public=True, share_token=trip.share_token, share_url=share_url(trip.share_token))


@router.delete("/api/trips/{trip_id}/share", response_model=ShareOut)
def unshare_trip(trip_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That trip does not exist.")
    if trip.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This trip belongs to another traveller.")

    trip.is_public = False
    db.commit()
    return ShareOut(is_public=False, share_token=None, share_url=None)


@router.get("/api/share/{token}", response_model=TripDetail)
def read_shared_trip(token: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.share_token == token, Trip.is_public.is_(True)).first()
    if trip is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This link is not valid, or the trip is no longer shared.")
    return trip
