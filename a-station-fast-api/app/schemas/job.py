from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel
from enum import Enum

from app.schemas.base import TimestampedUUIDSchema


class JobStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class JobCreate(BaseModel):
    workspace_id: UUID
    source_id: UUID
    playbook_path: str
    inventory_path: str
    extra_vars: Optional[dict] = None
    ansible_version: str


class JobRead(TimestampedUUIDSchema):
    workspace_id: UUID
    source_id: UUID
    playbook_path: str
    inventory_path: str
    extra_vars: Optional[dict] = None
    triggered_by_id: UUID
    status: JobStatus
    log_output: Optional[str] = None
    ansible_version: str
    finished_at: Optional[datetime] = None


class JobRunResponse(BaseModel):
    id: UUID
    status: JobStatus
    task_id: Optional[str] = None
    queue: Optional[str] = None
    celery_status: Optional[str] = None
    result: Optional[dict] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
