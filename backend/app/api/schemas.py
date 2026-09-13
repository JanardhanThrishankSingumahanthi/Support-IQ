from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ErrorResponse(BaseModel):
    status: str = Field(default="error")
    message: str
    detail: str | None = None
    code: str | None = None
    feature: str | None = None


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total: int | None = None
    has_next: bool | None = None
    has_previous: bool | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    meta: PaginationMeta


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str
    environment: str
    debug: bool
    timestamp: datetime | None = None


class EmptyResponse(BaseModel):
    status: str = "ok"
    message: str


class NoteResponse(BaseModel):
    status: str
    message: str
    feature: str | None = None
    details: dict[str, Any] | None = None
