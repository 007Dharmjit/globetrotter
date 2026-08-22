from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Trip, User
from ..budget import stop_cost, trip_budget
from ..schemas import BudgetOut, TripCreate, TripDetail, TripIn, TripOut, TripSummary

router = APIRouter(prefix="/api/trips", tags=["trips"])


def owned_trip(trip_id: int, db: Session, user: User) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That trip does not exist.")
    if trip.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This trip belongs to another traveller.")
    return trip


@router.get("", response_model=list[TripSummary])
def list_trips(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trips = db.query(Trip).filter(Trip.user_id == user.id).order_by(Trip.start_date).all()
    return [
        TripSummary.model_validate(trip).model_copy(
            update={
                "stop_count": len(trip.stops),
                "estimated_cost": sum((stop_cost(stop)["total"] for stop in trip.stops), Decimal("0")),
            }
        )
        for trip in trips
    ]


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
def create_trip(payload: TripCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = Trip(user_id=user.id, **payload.model_dump())
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


@router.get("/{trip_id}", response_model=TripDetail)
def read_trip(trip_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return owned_trip(trip_id, db, user)


@router.get("/{trip_id}/budget", response_model=BudgetOut)
def read_budget(trip_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return trip_budget(owned_trip(trip_id, db, user))


@router.put("/{trip_id}", response_model=TripOut)
def update_trip(trip_id: int, payload: TripIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = owned_trip(trip_id, db, user)
    for field, value in payload.model_dump().items():
        setattr(trip, field, value)
    db.commit()
    db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(trip_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = owned_trip(trip_id, db, user)
    db.delete(trip)
    db.commit()
