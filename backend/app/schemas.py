import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PASSWORD_RULE = "Password must be at least 8 characters and include a letter and a number."


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
        if len(value) < 8 or not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
            raise ValueError(PASSWORD_RULE)
        return value


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
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
