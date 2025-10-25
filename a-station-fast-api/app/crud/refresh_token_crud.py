from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_
import uuid

from app.models.refresh_token import RefreshToken

def get_refresh_token_by_hash(
    db: Session,
    token_hash: str,
)->RefreshToken | None:
    """
    Get a refresh token by its hash.
    """
    now = datetime.now(timezone.utc)
    token = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.expires_at > now,
        RefreshToken.revoked == False,
    ).first()

    return token

def create_refresh_token_record(
    db: Session,
    user_id: uuid.UUID,
    token_hash: str,
    family_id: uuid.UUID,
    expires_at: datetime,
    device_info: str | None = None,
    ip_address: str | None = None
) -> RefreshToken:
    """Create a new refresh token."""
    refresh_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=expires_at,
        revoked=False,
        device_info=device_info,
        ip_address=ip_address
    )

    db.add(refresh_token)
    db.commit()
    db.refresh(refresh_token)

    return refresh_token

def revoke_refresh_token(
    db: Session,
    token_id: uuid.UUID,
    replaced_by_id: uuid.UUID | None = None,
) -> bool:
    """Revoke a refresh token."""
    token = db.query(RefreshToken).filter(RefreshToken.id == token_id).first()
    if not token:
        return False
    token.revoked = True
    token.updated_at = datetime.now(timezone.utc)

    if replaced_by_id:
        token.replaced_by_token_id = replaced_by_id

    db.commit()
    return True


def revoke_all_user_tokens(
    db: Session,
    user_id: uuid.UUID | None = None,
) -> int:
    """Revoke all user tokens."""
    now = datetime.now(timezone.utc)
    tokens = db.query(RefreshToken).filter(
        and_(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False
        )
    ).all()
    for token in tokens:
        token.updated_at = now
        token.revoked = True
    db.commit()
    return len(tokens)

def get_active_token_count(
    db: Session,
    user_id: uuid.UUID | None = None, )-> int:
    """Get number of active refresh tokens."""
    now = datetime.now(timezone.utc)
    count = db.query(RefreshToken).filter(
        and_(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > now
        )
    ).count()

    return count