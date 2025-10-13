from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from app.models.base import Base
from .user import User
from .workspace import Workspace

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    role: Mapped[str] = mapped_column(String(20), default="MEMBER") #Reminder: OWNER, ADMIN, MEMBER, VIEWER
    workspace: Mapped["Workspace"] = relationship("Workspace", back_populates="member_associations")
    user: Mapped["User"] = relationship("User", back_populates="workspace_memberships")