from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.base import TimestampedUUIDSchema


class WorkspaceCreate(BaseModel):
    """Schema for creating a workspace"""
    name: str = Field(..., min_length=1, max_length=255)


class WorkspaceUpdate(BaseModel):
    """Schema for updating a workspace"""
    name: str | None = Field(None, min_length=1, max_length=255)


class WorkspaceRead(TimestampedUUIDSchema):
    """Schema for reading workspace data"""
    name: str
    owner_id: UUID