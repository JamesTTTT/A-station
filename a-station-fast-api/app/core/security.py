import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt
from jose.exceptions import JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.refresh_token import RefreshToken
from app.core.config import settings
from app.db.base import get_db
from app.crud.refresh_token_crud import create_refresh_token_record

#Hash the pass
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> uuid.UUID:
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str: str | None = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = uuid.UUID(user_id_str)
    except (ValueError, AttributeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID format in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def get_current_user(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    from app.crud.user_crud import get_user

    user = get_user(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def create_refresh_token(
    user_id: uuid.UUID,
    device_info: str,
    ip_address: str,
    db: Session) -> dict[str, Any]:

    raw_token = secrets.token_urlsafe(settings.REFRESH_TOKEN_LENGTH)
    token_hash = hash_token(raw_token)
    family_id = uuid.uuid4()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = create_refresh_token_record(
        db=db,
        user_id=user_id,
        token_hash=token_hash,
        family_id=family_id,
        expires_at=expires_at,
        device_info=device_info,
        ip_address=ip_address,
    )
    return {
        'refresh_token': raw_token,
        'token_id': db_token.id,
        'expires_at': expires_at
    }

def hash_token(token:str)->str:
    return hashlib.sha256(token.encode()).hexdigest()

def verify_refresh_token(token:str, token_hash:str)->bool:
    computed_token = hash_token(token)
    return secrets.compare_digest(computed_token, token_hash)

def revoke_token_family(db:Session, family_id:uuid) -> int:
    tokens = db.query(RefreshToken).filter(
        RefreshToken.family_id == family_id,
        RefreshToken.revoked == False
    ).all()
    for token in tokens:
        token.revoked = True
        token.updated_at = datetime.now(timezone.utc)
    db.commit()
    return len(tokens)

def cleanup_expired_tokens(db:Session)->int:
    now = datetime.now(timezone.utc)
    week = now - timedelta(days=7)
    result = db.query(RefreshToken).filter(
        (RefreshToken.expires_at < now) | ((RefreshToken.revoked == True) & (RefreshToken.created_at < week))
    ).delete(synchronize_session=False)

    db.commit()
    return result
