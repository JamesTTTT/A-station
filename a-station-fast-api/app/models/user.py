from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, TYPE_CHECKING
from .base import TimestampedUUIDModel

if TYPE_CHECKING:
    from .workspace import Workspace
    from .workspace_member import WorkspaceMember
    from .refresh_token import RefreshToken

class User(TimestampedUUIDModel):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    username: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)

    owned_workspaces: Mapped[List["Workspace"]] = relationship(
        "Workspace",
        back_populates="owner"
    )

    workspace_memberships: Mapped[List["WorkspaceMember"]] = relationship(
        "WorkspaceMember",
        back_populates="user"
    )

    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )
