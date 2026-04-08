from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, Field, model_validator

from app.models.project_source import SourceType
from app.schemas.base import TimestampedUUIDSchema


class ProjectSourceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    source_type: SourceType
    git_url: Optional[str] = None
    git_branch: Optional[str] = "main"
    local_path: Optional[str] = None

    @model_validator(mode="after")
    def validate_source_fields(self):
        if self.source_type == SourceType.GIT and not self.git_url:
            raise ValueError("git_url is required for git sources")
        if self.source_type == SourceType.LOCAL and not self.local_path:
            raise ValueError("local_path is required for local sources")
        return self


class ProjectSourceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    git_branch: Optional[str] = Field(None, min_length=1, max_length=100)


class ProjectSourceRead(TimestampedUUIDSchema):
    workspace_id: UUID
    name: str
    source_type: SourceType
    local_path: str
    git_url: Optional[str] = None
    git_branch: Optional[str] = None
    last_synced_at: Optional[datetime] = None
