from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import TimestampedUUIDModel
import uuid
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User


class RefreshToken(TimestampedUUIDModel):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    token_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        unique=True,
        index=True
    )

    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    
    revoked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True
    )

    replaced_by_token_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("refresh_tokens.id"),
        nullable=True
    )

    family_id: Mapped[uuid.UUID] = mapped_column(
        nullable=False,
        index=True
    )

    device_info: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    ip_address: Mapped[str | None] = mapped_column(
        String(45),  
        nullable=True
    )

    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
