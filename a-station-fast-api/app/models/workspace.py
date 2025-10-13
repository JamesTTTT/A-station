from typing import List

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
#from typing import TYPE_CHECKING
from .base import TimestampedUUIDModel
from .user import User
from .workspace_member import WorkspaceMember

class Workspace(TimestampedUUIDModel):
    __tablename__ = "workspaces"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))


    owner: Mapped["User"] = relationship("User", back_populates="owned_workspaces")

    member_associations: Mapped[List["WorkspaceMember"]] = relationship(
        "WorkspaceMember",
        back_populates="workspace"
    )
