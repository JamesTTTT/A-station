import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, Text, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import TimestampedUUIDModel
from .user import User


class Job(TimestampedUUIDModel):
    __tablename__ = "jobs"

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    source_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("project_sources.id"), nullable=False)
    playbook_path: Mapped[str] = mapped_column(String, nullable=False)
    inventory_path: Mapped[str] = mapped_column(String, nullable=False)
    extra_vars: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    triggered_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(20))
    log_output: Mapped[Optional[str]] = mapped_column(Text)
    ansible_version: Mapped[str] = mapped_column(String(10))
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    created_by: Mapped["User"] = relationship("User", foreign_keys=[triggered_by_id])


class JobStatus:
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
