from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Activity, Stop, StopActivity, Trip, User
from ..schemas import ActivityReorderIn, ReorderIn, StopActivityIn, StopActivityOut, StopIn, StopOut

router = APIRouter(tags=["stops"])


def owned_trip(trip_id: int, db: Session, user: User) -> Trip:
    trip = db.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That trip does not exist.")
    if trip.user_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This trip belongs to another traveller.")
    return trip


def owned_stop(stop_id: int, db: Session, user: User) -> Stop:
    stop = db.get(Stop, stop_id)
    if stop is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That stop does not exist.")
    owned_trip(stop.trip_id, db, user)
    return stop


def apply_order(db: Session, stops_in_order: list[Stop]):
    # Two passes: park the rows on temporary negative numbers first, otherwise swapping
    # two stops trips the unique index on (trip_id, order_index) halfway through.
    for offset, stop in enumerate(stops_in_order):
        stop.order_index = -(offset + 1)
    db.flush()
    for position, stop in enumerate(stops_in_order):
        stop.order_index = position
    db.flush()


def check_stop_dates(trip: Trip, payload: StopIn, ignore_stop_id: int | None = None):
    if payload.arrival_date < trip.start_date or payload.departure_date > trip.end_date:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Stop dates must sit inside the trip ({trip.start_date} to {trip.end_date}).",
        )

    for other in trip.stops:
        if other.id == ignore_stop_id:
            continue
        # Arriving on the day you leave the previous city is fine; anything more is a clash.
        if payload.arrival_date < other.departure_date and other.arrival_date < payload.departure_date:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"Those dates overlap your stop in {other.city.name}.",
            )


@router.post("/api/trips/{trip_id}/stops", response_model=StopOut, status_code=status.HTTP_201_CREATED)
def add_stop(trip_id: int, payload: StopIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = owned_trip(trip_id, db, user)
    check_stop_dates(trip, payload)

    next_index = max((stop.order_index for stop in trip.stops), default=-1) + 1
    stop = Stop(trip_id=trip.id, order_index=next_index, **payload.model_dump())
    db.add(stop)
    db.commit()
    db.refresh(stop)
    return stop


@router.put("/api/stops/{stop_id}", response_model=StopOut)
def edit_stop(stop_id: int, payload: StopIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stop = owned_stop(stop_id, db, user)
    check_stop_dates(stop.trip, payload, ignore_stop_id=stop.id)

    stranded = [
        a for a in stop.activities if not payload.arrival_date <= a.scheduled_date <= payload.departure_date
    ]
    if stranded:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "Some activities in this stop fall outside the new dates. Move or remove them first.",
        )

    for field, value in payload.model_dump().items():
        setattr(stop, field, value)
    db.commit()
    db.refresh(stop)
    return stop


@router.delete("/api/stops/{stop_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_stop(stop_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stop = owned_stop(stop_id, db, user)
    trip = stop.trip
    db.delete(stop)
    db.flush()

    apply_order(db, sorted(trip.stops, key=lambda s: s.order_index))
    db.commit()


@router.put("/api/trips/{trip_id}/stops/reorder", response_model=list[StopOut])
def reorder_stops(trip_id: int, payload: ReorderIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    trip = owned_trip(trip_id, db, user)
    by_id = {stop.id: stop for stop in trip.stops}

    if sorted(payload.stop_ids) != sorted(by_id):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "The new order must list every stop of this trip once.")

    apply_order(db, [by_id[stop_id] for stop_id in payload.stop_ids])
    db.commit()

    return sorted(by_id.values(), key=lambda stop: stop.order_index)


@router.post("/api/stops/{stop_id}/activities", response_model=StopActivityOut, status_code=status.HTTP_201_CREATED)
def add_activity(
    stop_id: int,
    payload: StopActivityIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stop = owned_stop(stop_id, db, user)

    activity = db.get(Activity, payload.activity_id)
    if activity is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That activity does not exist.")
    if activity.city_id != stop.city_id:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"{activity.name} is not in {stop.city.name}. Pick an activity from this city.",
        )
    if not stop.arrival_date <= payload.scheduled_date <= stop.departure_date:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Pick a day between {stop.arrival_date} and {stop.departure_date}.",
        )

    next_index = max((planned.order_index for planned in stop.activities), default=-1) + 1
    planned = StopActivity(stop_id=stop.id, order_index=next_index, **payload.model_dump())
    db.add(planned)
    db.commit()
    db.refresh(planned)
    return planned


@router.put("/api/stops/{stop_id}/activities/reorder", response_model=list[StopActivityOut])
def reorder_activities(
    stop_id: int,
    payload: ActivityReorderIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    stop = owned_stop(stop_id, db, user)
    by_id = {planned.id: planned for planned in stop.activities}

    if sorted(payload.activity_ids) != sorted(by_id):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "The new order must list every activity in this stop once.",
        )

    for position, planned_id in enumerate(payload.activity_ids):
        by_id[planned_id].order_index = position
    db.commit()

    return sorted(by_id.values(), key=lambda planned: planned.order_index)


@router.delete("/api/stop-activities/{planned_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_activity(planned_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    planned = db.get(StopActivity, planned_id)
    if planned is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That activity is not in your plan.")
    owned_stop(planned.stop_id, db, user)
    db.delete(planned)
    db.commit()
