import uuid

from sqlalchemy import String, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from .base import TimestampedUUIDModel

if TYPE_CHECKING:
    from .job import Job

class Playbook(TimestampedUUIDModel):
    __tablename__ = "playbooks"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    yaml_content: Mapped[str] = mapped_column(Text, nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"))

    jobs: Mapped[List["Job"]] = relationship("Job", back_populates="playbook")
