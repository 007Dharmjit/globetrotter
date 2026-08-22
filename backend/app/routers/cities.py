from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import City, User
from ..schemas import CityOut

router = APIRouter(prefix="/api/cities", tags=["cities"])

SORTS = {
    "popularity": (City.popularity.desc(), City.name),
    "name": (City.name,),
    "cost": (City.cost_index, City.name),
}


@router.get("", response_model=list[CityOut])
def search_cities(
    q: str | None = None,
    country: str | None = None,
    region: str | None = None,
    sort: str = "popularity",
    limit: int = Query(default=60, ge=1, le=100),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if q is not None and not q.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Type at least one character to search.")
    if sort not in SORTS:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Unknown sort order.")

    query = db.query(City)
    if q:
        term = f"%{q.strip().lower()}%"
        query = query.filter(func.lower(City.name).like(term) | func.lower(City.country).like(term))
    if country:
        query = query.filter(func.lower(City.country) == country.strip().lower())
    if region:
        query = query.filter(func.lower(City.region) == region.strip().lower())

    return query.order_by(*SORTS[sort]).limit(limit).all()


@router.get("/regions", response_model=list[str])
def list_regions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [row[0] for row in db.query(City.region).distinct().order_by(City.region).all()]


@router.get("/popular", response_model=list[CityOut])
def popular_cities(
    limit: int = Query(default=6, ge=1, le=12),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.query(City).order_by(City.popularity.desc()).limit(limit).all()
