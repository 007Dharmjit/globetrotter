import os
import secrets
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Stop, StopActivity, Trip, User
from ..schemas import ShareOut, TripDetail, TripOut

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


def copy_name(original: str) -> str:
    marked = f"{original} (copy)"
    # The column stops at 100 characters, so a long name loses its tail rather than the marker.
    return marked if len(marked) <= 100 else f"{original[:93].rstrip()} (copy)"


@router.post("/api/share/{token}/copy", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def copy_shared_trip(token: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    original = db.query(Trip).filter(Trip.share_token == token, Trip.is_public.is_(True)).first()
    if original is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This link is not valid, or the trip is no longer shared.")

    # Someone else's dates are probably in the past by now, so the copy starts tomorrow
    # and every stop and activity moves with it, keeping the shape of the trip intact.
    shift = (date.today() + timedelta(days=1)) - original.start_date

    copy = Trip(
        user_id=user.id,
        name=copy_name(original.name),
        description=original.description,
        start_date=original.start_date + shift,
        end_date=original.end_date + shift,
        total_budget=original.total_budget,
    )
    db.add(copy)
    db.flush()

    for stop in sorted(original.stops, key=lambda s: s.order_index):
        copied_stop = Stop(
            trip_id=copy.id,
            city_id=stop.city_id,
            order_index=stop.order_index,
            arrival_date=stop.arrival_date + shift,
            departure_date=stop.departure_date + shift,
            transport_cost=stop.transport_cost,
            stay_cost_override=stop.stay_cost_override,
        )
        db.add(copied_stop)
        db.flush()

        for planned in stop.activities:
            db.add(
                StopActivity(
                    stop_id=copied_stop.id,
                    activity_id=planned.activity_id,
                    scheduled_date=planned.scheduled_date + shift,
                    start_time=planned.start_time,
                    cost_override=planned.cost_override,
                    notes=planned.notes,
                )
            )

    db.commit()
    db.refresh(copy)
    return copy
