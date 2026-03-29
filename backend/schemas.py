from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator


class TodoCreate(BaseModel):
    name: str
    priority: int | None = None
    due_date: date | None = None

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("must not be blank")
        return v.strip()

    @field_validator("priority")
    @classmethod
    def priority_must_be_valid(cls, v: int | None) -> int | None:
        if v is not None and v not in (0, 1, 2, 3):
            raise ValueError("must be 0, 1, 2, or 3")
        return v


class TodoUpdate(BaseModel):
    name: str | None = None
    done: bool | None = None
    priority: int | None = None
    due_date: date | None = None

    @field_validator("priority")
    @classmethod
    def priority_must_be_valid(cls, v: int | None) -> int | None:
        if v is not None and v not in (0, 1, 2, 3):
            raise ValueError("must be 0, 1, 2, or 3")
        return v


class TodoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    done: bool
    priority: int | None
    due_date: date | None
    created_at: datetime
    updated_at: datetime
