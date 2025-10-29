import uuid
import secrets
from datetime import datetime, timezone, timedelta
from ipaddress import ip_address

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Cookie
from sqlalchemy.orm import Session

from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    hash_token,
    get_current_user_id
)
from app.schemas.user import UserCreate, UserLogin, UserRead, TokenResponse
from app.crud.user_crud import create_user, get_user_by_email, user_exists, get_user
from app.crud.refresh_token_crud import (
    revoke_all_user_tokens,
    create_refresh_token_record
)
from app.db.base import get_db
from app.core.config import settings
from app.crud.refresh_token_crud import get_refresh_token_by_hash, revoke_refresh_token
from app.models.refresh_token import RefreshToken
from app.schemas.refresh_token import RefreshTokenRequest

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])

@auth_router.post(
    "/register", response_model=UserRead, status_code=status.HTTP_201_CREATED
)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if user_exists(db, email=user_data.email, username=user_data.username):
        if user_exists(db, email=user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
            )

    hashed_password = get_password_hash(user_data.password)
    user = create_user(db, user_data, hashed_password)

    return user


@auth_router.post("/login", response_model=TokenResponse)
async def login_user(
        login_data: UserLogin,
        request: Request,
        response: Response,
        db: Session = Depends(get_db)):

    user = get_user_by_email(db, login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    device_info = request.headers.get("user-agent", "Unknown")
    ip_address = request.client.host if request.client else "Unknown"

    refresh_token_data = create_refresh_token(
        user_id=user.id,
        device_info=device_info,
        ip_address=ip_address,
        db=db
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token_data['refresh_token'],
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@auth_router.post("/logout")
async def logout_user(
    response: Response,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    refresh_token_cookie: str | None = Cookie(None, alias="refresh_token")
):
    """Logout user"""
    if refresh_token_cookie:
        token_hash = hash_token(refresh_token_cookie)
        db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()

        if db_token:
            if db_token.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token does not belong to this user",
                )
            revoke_refresh_token(db, db_token.id)

    response.delete_cookie(
        key="refresh_token",
        path="/"
    )

    return {"message": "Logged out successfully"}

@auth_router.post("/logout-all")
async def logout_all_devices(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    count = revoke_all_user_tokens(db, user_id)
    return {
        "message": f"Logged out from all devices",
        "sessions_revoked": count
    }

@auth_router.post("/refresh-token", response_model=TokenResponse)
async def refresh_token(
        request: Request,
        response: Response,
        db: Session = Depends(get_db),
        refresh_token_cookie: str | None = Cookie(None, alias="refresh_token")
):
    """Refresh an expired access token"""
    if not refresh_token_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    raw_token = refresh_token_cookie
    token_hash = hash_token(raw_token)
    db_token = get_refresh_token_by_hash(db, token_hash)

    #Grace period to handle race condition issues
    if not db_token:
        now = datetime.now(timezone.utc)
        potential_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash
        ).first()


        if potential_token and potential_token.revoked and potential_token.replaced_by_token_id:
            grace_period = timedelta(seconds=30)
            if potential_token.updated_at and (datetime.now(timezone.utc) - potential_token.updated_at) < grace_period:
                new_token = db.query(RefreshToken).filter(
                    RefreshToken.id == potential_token.replaced_by_token_id,
                    RefreshToken.expires_at > now,
                    RefreshToken.revoked == False
                ).first()
                if new_token:
                    user = get_user(db, new_token.user_id)
                    if user:
                        new_access_token = create_access_token(data={"sub": str(user.id)})
                        return TokenResponse(
                            access_token=new_access_token,
                            token_type="bearer",
                            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
                        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user(db, db_token.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    new_access_token = create_access_token(data={"sub": str(user.id)})

    device_info = request.headers.get("user-agent", "Unknown")
    ip_address = request.client.host if request.client else "Unknown"

    new_raw_token = secrets.token_urlsafe(settings.REFRESH_TOKEN_LENGTH)
    new_token_hash = hash_token(new_raw_token)
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    new_db_token = create_refresh_token_record(
        db=db,
        user_id=user.id,
        token_hash=new_token_hash,
        family_id=db_token.family_id,
        expires_at=expires_at,
        device_info=device_info,
        ip_address=ip_address
    )

    revoke_refresh_token(
        db,
        token_id=db_token.id,
        replaced_by_id=new_db_token.id
    )

    response.set_cookie(
        key="refresh_token",
        value=new_raw_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/"
    )

    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@auth_router.post("/verify-email")
async def verify_email():
    """Send email verification link"""
    return {"message": "Email verification link sent"}
