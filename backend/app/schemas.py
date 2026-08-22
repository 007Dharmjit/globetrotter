import re
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

PASSWORD_RULE = "Password must be at least 8 characters and include a letter and a number."


def strong_password(value: str) -> str:
    if len(value) < 8 or not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValueError(PASSWORD_RULE)
    return value


# Language only changes how the interface addresses you; the catalogue stays in English.
LANGUAGES = ("en", "hi", "gu", "fr", "es")


class SignupIn(BaseModel):
    name: str = Field(max_length=80)
    email: EmailStr
    password: str = Field(max_length=72)

    @field_validator("name")
    @classmethod
    def check_name(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return value

    @field_validator("email")
    @classmethod
    def normalise_email(cls, value):
        return value.strip().lower()

    @field_validator("password")
    @classmethod
    def check_password(cls, value):
        return strong_password(value)


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def normalise_email(cls, value):
        return value.strip().lower()


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    language: str
    avatar: str | None
    is_admin: bool
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotIn(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalise_email(cls, value):
        return value.strip().lower()


class ForgotOut(BaseModel):
    message: str
    # There is no mail server in an offline build, so the link comes straight back.
    reset_link: str | None = None


class ResetIn(BaseModel):
    token: str = Field(min_length=1, max_length=64)
    password: str = Field(max_length=72)

    @field_validator("password")
    @classmethod
    def check_password(cls, value):
        return strong_password(value)


class MessageOut(BaseModel):
    message: str


MAX_TRIP_DAYS = 60


class TripIn(BaseModel):
    name: str = Field(max_length=100)
    description: str | None = Field(default=None, max_length=500)
    start_date: date
    end_date: date
    total_budget: Decimal | None = None

    @field_validator("name")
    @classmethod
    def check_name(cls, value):
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Trip name must be at least 3 characters.")
        return value

    @field_validator("description")
    @classmethod
    def tidy_description(cls, value):
        return value.strip() if value else None

    @field_validator("total_budget")
    @classmethod
    def check_budget(cls, value):
        if value is not None and value <= 0:
            raise ValueError("Budget must be greater than zero.")
        return value

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("End date must be on or after the start date.")
        if (self.end_date - self.start_date).days > MAX_TRIP_DAYS:
            raise ValueError(f"A trip can span at most {MAX_TRIP_DAYS} days.")
        return self


class TripCreate(TripIn):
    @model_validator(mode="after")
    def check_start_not_past(self):
        if self.start_date < date.today():
            raise ValueError("Start date cannot be in the past.")
        return self


class TripOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    start_date: date
    end_date: date
    total_budget: Decimal | None
    cover_image: str | None
    is_public: bool
    share_token: str | None
    created_at: datetime


class TripSummary(TripOut):
    stop_count: int = 0
    estimated_cost: Decimal = Decimal("0")


class CityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    country: str
    region: str
    cost_index: int
    popularity: int
    avg_stay_cost_per_day: Decimal
    avg_meal_cost_per_day: Decimal
    image_url: str | None


class SavedCityIn(BaseModel):
    city_id: int


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    city_id: int
    name: str
    category: str
    cost: Decimal
    duration_hours: Decimal
    description: str | None


class StopIn(BaseModel):
    city_id: int
    arrival_date: date
    departure_date: date
    transport_cost: Decimal = Decimal("0")
    stay_cost_override: Decimal | None = None

    @field_validator("transport_cost")
    @classmethod
    def check_transport(cls, value):
        if value < 0:
            raise ValueError("Transport cost cannot be negative.")
        return value

    @field_validator("stay_cost_override")
    @classmethod
    def check_stay(cls, value):
        if value is not None and value < 0:
            raise ValueError("Stay cost cannot be negative.")
        return value

    @model_validator(mode="after")
    def check_dates(self):
        if self.departure_date < self.arrival_date:
            raise ValueError("Departure must be on or after arrival.")
        return self


class StopActivityIn(BaseModel):
    activity_id: int
    scheduled_date: date
    start_time: time | None = None
    cost_override: Decimal | None = None
    notes: str | None = Field(default=None, max_length=200)

    @field_validator("cost_override")
    @classmethod
    def check_cost(cls, value):
        if value is not None and value < 0:
            raise ValueError("Cost cannot be negative.")
        return value

    @field_validator("notes")
    @classmethod
    def tidy_notes(cls, value):
        return value.strip() if value and value.strip() else None


class StopActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stop_id: int
    activity_id: int
    order_index: int
    scheduled_date: date
    start_time: time | None
    cost_override: Decimal | None
    notes: str | None
    activity: ActivityOut


class StopOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trip_id: int
    city_id: int
    order_index: int
    arrival_date: date
    departure_date: date
    transport_cost: Decimal
    stay_cost_override: Decimal | None
    city: CityOut
    activities: list[StopActivityOut]


class TripDetail(TripOut):
    stops: list[StopOut] = []


class ReorderIn(BaseModel):
    stop_ids: list[int] = Field(min_length=1)


class ActivityReorderIn(BaseModel):
    activity_ids: list[int] = Field(min_length=1)


class BudgetByStop(BaseModel):
    stop_id: int
    city: str
    country: str
    nights: int
    transport: Decimal
    stay: Decimal
    meals: Decimal
    activities: Decimal
    total: Decimal


class BudgetByDay(BaseModel):
    date: date
    cost: Decimal
    over_budget: bool


class BudgetOut(BaseModel):
    total: Decimal
    total_budget: Decimal | None
    by_category: dict[str, Decimal]
    by_stop: list[BudgetByStop]
    by_day: list[BudgetByDay]
    avg_per_day: Decimal
    daily_limit: Decimal | None
    trip_days: int
    over_budget: bool


class ShareOut(BaseModel):
    is_public: bool
    share_token: str | None
    share_url: str | None


class UserUpdate(BaseModel):
    name: str = Field(max_length=80)
    language: str = Field(default="en", max_length=10)

    @field_validator("name")
    @classmethod
    def check_name(cls, value):
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return value

    @field_validator("language")
    @classmethod
    def check_language(cls, value):
        value = value.strip().lower()
        if value not in LANGUAGES:
            raise ValueError("Choose one of the languages we support.")
        return value


class AdminTotals(BaseModel):
    users: int
    trips: int
    stops: int
    planned_activities: int


class AdminDayCount(BaseModel):
    date: date
    trips: int


class AdminCityCount(BaseModel):
    city: str
    country: str
    stops: int


class AdminActivityCount(BaseModel):
    activity: str
    city: str
    times_planned: int


class AdminUserRow(BaseModel):
    id: int
    name: str
    email: EmailStr
    joined: date
    trips: int


class AdminStats(BaseModel):
    totals: AdminTotals
    trips_per_day: list[AdminDayCount]
    top_cities: list[AdminCityCount]
    top_activities: list[AdminActivityCount]
    recent_users: list[AdminUserRow]
