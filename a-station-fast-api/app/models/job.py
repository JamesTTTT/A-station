from sqlalchemy import String, ForeignKey, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, TYPE_CHECKING
from datetime import datetime
from .base import TimestampedUUIDModel
import uuid

if TYPE_CHECKING:
    from .playbook import Playbook

class Job(TimestampedUUIDModel):
    __tablename__ = "jobs"

    playbook_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("playbooks.id"))
    triggered_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    log_output: Mapped[Optional[str]] = mapped_column(Text)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    playbook: Mapped["Playbook"] = relationship("Playbook", back_populates="jobs")