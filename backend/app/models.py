from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Time,
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
    avatar = Column(String(255))
    is_admin = Column(Boolean, nullable=False, default=False, server_default="false")
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    trips = relationship("Trip", back_populates="user", cascade="all, delete-orphan")
    saved_cities = relationship("SavedCity", back_populates="user", cascade="all, delete-orphan")


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(64), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User")


class SavedCity(Base):
    __tablename__ = "saved_cities"
    __table_args__ = (UniqueConstraint("user_id", "city_id", name="uq_saved_city"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="saved_cities")
    city = relationship("City")


class Trip(Base):
    __tablename__ = "trips"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_trip_dates"),
        CheckConstraint("total_budget is null or total_budget > 0", name="ck_trip_budget"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_budget = Column(Numeric(12, 2))
    cover_image = Column(String(255))
    is_public = Column(Boolean, nullable=False, default=False)
    share_token = Column(String(32), unique=True, index=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User", back_populates="trips")
    stops = relationship(
        "Stop",
        back_populates="trip",
        cascade="all, delete-orphan",
        order_by="Stop.order_index",
    )


class Stop(Base):
    __tablename__ = "stops"
    __table_args__ = (
        UniqueConstraint("trip_id", "order_index", name="uq_stop_order"),
        CheckConstraint("departure_date >= arrival_date", name="ck_stop_dates"),
        CheckConstraint("transport_cost >= 0", name="ck_stop_transport"),
    )

    id = Column(Integer, primary_key=True)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False, index=True)
    city_id = Column(Integer, ForeignKey("cities.id"), nullable=False)
    order_index = Column(Integer, nullable=False)
    arrival_date = Column(Date, nullable=False)
    departure_date = Column(Date, nullable=False)
    transport_cost = Column(Numeric(10, 2), nullable=False, default=0)
    stay_cost_override = Column(Numeric(10, 2))

    trip = relationship("Trip", back_populates="stops")
    city = relationship("City")
    activities = relationship(
        "StopActivity",
        back_populates="stop",
        cascade="all, delete-orphan",
        order_by="StopActivity.order_index, StopActivity.id",
    )


class StopActivity(Base):
    __tablename__ = "stop_activities"
    __table_args__ = (CheckConstraint("cost_override is null or cost_override >= 0", name="ck_stop_activity_cost"),)

    id = Column(Integer, primary_key=True)
    stop_id = Column(Integer, ForeignKey("stops.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=0, server_default="0")
    scheduled_date = Column(Date, nullable=False)
    start_time = Column(Time)
    cost_override = Column(Numeric(10, 2))
    notes = Column(String(200))

    stop = relationship("Stop", back_populates="activities")
    activity = relationship("Activity")


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
