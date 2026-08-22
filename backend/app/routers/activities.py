from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ACTIVITY_CATEGORIES, Activity, City, User
from ..schemas import ActivityOut

router = APIRouter(prefix="/api/activities", tags=["activities"])


@router.get("", response_model=list[ActivityOut])
def search_activities(
    city_id: int = Query(..., description="Activities are always browsed one city at a time"),
    category: str | None = None,
    max_cost: Decimal | None = Query(default=None, ge=0),
    max_duration: Decimal | None = Query(default=None, gt=0),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if db.get(City, city_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That city is not in the catalogue.")
    if category and category not in ACTIVITY_CATEGORIES:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown activity category.")

    query = db.query(Activity).filter(Activity.city_id == city_id)
    if category:
        query = query.filter(Activity.category == category)
    if max_cost is not None:
        query = query.filter(Activity.cost <= max_cost)
    if max_duration is not None:
        query = query.filter(Activity.duration_hours <= max_duration)

    return query.order_by(Activity.category, Activity.name).all()


@router.get("/categories", response_model=list[str])
def list_categories(user: User = Depends(get_current_user)):
    return list(ACTIVITY_CATEGORIES)
