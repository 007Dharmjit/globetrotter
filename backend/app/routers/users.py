from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import City, SavedCity, User
from ..schemas import LANGUAGES, CityOut, SavedCityIn, UserOut, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_me(user: User = Depends(get_current_user)):
    return user


@router.get("/languages", response_model=list[str])
def supported_languages():
    return list(LANGUAGES)


@router.put("/me", response_model=UserOut)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.name = payload.name
    user.language = payload.language
    db.commit()
    db.refresh(user)
    return user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.delete(user)
    db.commit()


@router.get("/me/saved-cities", response_model=list[CityOut])
def list_saved_cities(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        row.city
        for row in db.query(SavedCity)
        .filter(SavedCity.user_id == user.id)
        .order_by(SavedCity.created_at.desc(), SavedCity.id.desc())
        .all()
    ]


@router.post("/me/saved-cities", response_model=CityOut, status_code=status.HTTP_201_CREATED)
def save_city(payload: SavedCityIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    city = db.get(City, payload.city_id)
    if city is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That city is not in the catalogue.")

    already = db.query(SavedCity).filter(SavedCity.user_id == user.id, SavedCity.city_id == city.id).first()
    if already is None:
        db.add(SavedCity(user_id=user.id, city_id=city.id))
        db.commit()
    return city


@router.delete("/me/saved-cities/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_city(city_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    saved = db.query(SavedCity).filter(SavedCity.user_id == user.id, SavedCity.city_id == city_id).first()
    if saved is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "That city is not on your saved list.")
    db.delete(saved)
    db.commit()
