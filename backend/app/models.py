from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import relationship

from .database import Base

ACTIVITY_CATEGORIES = ("sightseeing", "food", "adventure", "culture", "nightlife", "shopping")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False)
    email = Column(String(120), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    language = Column(String(10), nullable=False, default="en")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class City(Base):
    __tablename__ = "cities"
    __table_args__ = (
        UniqueConstraint("name", "country", name="uq_city_name_country"),
        CheckConstraint("cost_index between 1 and 5", name="ck_city_cost_index"),
        CheckConstraint("popularity between 1 and 100", name="ck_city_popularity"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, index=True)
    country = Column(String(100), nullable=False)
    region = Column(String(50), nullable=False)
    # 1 = cheap, 5 = expensive. Drives the dots shown on a city card.
    cost_index = Column(Integer, nullable=False, default=3)
    popularity = Column(Integer, nullable=False, default=50)
    avg_stay_cost_per_day = Column(Numeric(10, 2), nullable=False)
    avg_meal_cost_per_day = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String(255))

    activities = relationship("Activity", back_populates="city", cascade="all, delete-orphan")


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = (
        UniqueConstraint("city_id", "name", name="uq_activity_city_name"),
        CheckConstraint("cost >= 0", name="ck_activity_cost"),
        CheckConstraint("duration_hours > 0", name="ck_activity_duration"),
    )

    id = Column(Integer, primary_key=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    category = Column(
        Enum(*ACTIVITY_CATEGORIES, name="activity_category", native_enum=False, length=20),
        nullable=False,
    )
    cost = Column(Numeric(10, 2), nullable=False, default=0)
    duration_hours = Column(Numeric(4, 1), nullable=False)
    description = Column(Text)

    city = relationship("City", back_populates="activities")
