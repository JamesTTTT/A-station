from uuid import UUID
from pydantic import BaseModel, Field

from app.schemas.base import TimestampedUUIDSchema


class PlaybookCreate(BaseModel):
    """Schema for creating a playbook"""
    name: str = Field(..., min_length=1, max_length=255)
    yaml_content: str = Field(..., min_length=1)


class PlaybookUpdate(BaseModel):
    """Schema for updating a playbook"""
    name: str | None = Field(None, min_length=1, max_length=255)
    yaml_content: str | None = Field(None, min_length=1)


class PlaybookRead(TimestampedUUIDSchema):
    """Schema for reading playbook data"""
    name: str
    yaml_content: str
    workspace_id: UUID