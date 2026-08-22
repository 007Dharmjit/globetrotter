from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Activity, City, Stop, StopActivity, Trip, User
from ..schemas import AdminStats

router = APIRouter(prefix="/api/admin", tags=["admin"])

RECENT_DAYS = 14
TOP_N = 8


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This area is for administrators only.")
    return user


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    totals = {
        "users": db.query(func.count(User.id)).scalar(),
        "trips": db.query(func.count(Trip.id)).scalar(),
        "stops": db.query(func.count(Stop.id)).scalar(),
        "planned_activities": db.query(func.count(StopActivity.id)).scalar(),
    }

    first_day = date.today() - timedelta(days=RECENT_DAYS - 1)
    counted = dict(
        db.query(func.date(Trip.created_at), func.count(Trip.id))
        .filter(func.date(Trip.created_at) >= first_day)
        .group_by(func.date(Trip.created_at))
        .all()
    )
    trips_per_day = [
        {"date": first_day + timedelta(days=offset), "trips": counted.get(first_day + timedelta(days=offset), 0)}
        for offset in range(RECENT_DAYS)
    ]

    top_cities = [
        {"city": name, "country": country, "stops": count}
        for name, country, count in db.query(City.name, City.country, func.count(Stop.id))
        .join(Stop, Stop.city_id == City.id)
        .group_by(City.id, City.name, City.country)
        .order_by(func.count(Stop.id).desc(), City.name)
        .limit(TOP_N)
        .all()
    ]

    top_activities = [
        {"activity": name, "city": city, "times_planned": count}
        for name, city, count in db.query(Activity.name, City.name, func.count(StopActivity.id))
        .join(StopActivity, StopActivity.activity_id == Activity.id)
        .join(City, City.id == Activity.city_id)
        .group_by(Activity.id, Activity.name, City.name)
        .order_by(func.count(StopActivity.id).desc(), Activity.name)
        .limit(TOP_N)
        .all()
    ]

    trip_counts = dict(db.query(Trip.user_id, func.count(Trip.id)).group_by(Trip.user_id).all())
    recent_users = [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "joined": user.created_at.date(),
            "trips": trip_counts.get(user.id, 0),
        }
        for user in db.query(User).order_by(User.created_at.desc(), User.id.desc()).limit(10).all()
    ]

    return {
        "totals": totals,
        "trips_per_day": trips_per_day,
        "top_cities": top_cities,
        "top_activities": top_activities,
        "recent_users": recent_users,
    }
