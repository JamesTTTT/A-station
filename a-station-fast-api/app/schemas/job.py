from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from enum import Enum

from app.schemas.base import TimestampedUUIDSchema


class JobStatus(str, Enum):
    """Job status enum matching database values"""
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class JobCreate(BaseModel):
    """Schema for creating a job"""
    playbook_id: UUID
    # TODO: Add inventory_id when inventory is implemented


class JobRead(TimestampedUUIDSchema):
    """Schema for reading job data"""
    playbook_id: UUID
    triggered_by_id: UUID
    status: JobStatus
    log_output: str | None = None
    finished_at: datetime | None = None