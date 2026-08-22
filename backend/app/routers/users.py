from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from ..auth import get_current_user, verify_password
from ..database import get_db
from ..models import City, SavedCity, User
from ..schemas import LANGUAGES, CityOut, SavedCityIn, UserOut, UserUpdate
from ..uploads import remove_image, save_image

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

    if payload.email and payload.email != user.email:
        # The email is what you log in with, so an unattended session cannot quietly move it.
        if not payload.current_password or not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Enter your current password to change your email.")
        if db.query(User).filter(User.email == payload.email, User.id != user.id).first():
            raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists.")
        user.email = payload.email

    db.commit()
    db.refresh(user)
    return user


@router.post("/me/avatar", response_model=UserOut)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.avatar = save_image(file, str(user.id), folder="avatars")
    db.commit()
    db.refresh(user)
    return user


@router.delete("/me/avatar", response_model=UserOut)
def delete_avatar(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    remove_image(user.avatar)
    user.avatar = None
    db.commit()
    db.refresh(user)
    return user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    for trip in user.trips:
        remove_image(trip.cover_image)
    remove_image(user.avatar)
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
