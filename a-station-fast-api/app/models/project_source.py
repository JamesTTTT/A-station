import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, DateTime, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum

from .base import TimestampedUUIDModel


class SourceType(str, enum.Enum):
    GIT = "git"
    LOCAL = "local"


class ProjectSource(TimestampedUUIDModel):
    __tablename__ = "project_sources"

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[SourceType] = mapped_column(
        SAEnum(SourceType, values_callable=lambda e: [member.value for member in e]),
        nullable=False,
    )
    local_path: Mapped[str] = mapped_column(String, nullable=False)
    git_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    git_branch: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="main")
    last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
