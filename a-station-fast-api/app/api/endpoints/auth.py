from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserCreate, UserLogin, UserRead, TokenResponse
from app.crud.user import (
    create_user,
    get_user_by_email,
    user_exists
)
from app.db.base import get_db

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    if user_exists(db, email=user_data.email, username=user_data.username):
        if user_exists(db, email=user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

    hashed_password = get_password_hash(user_data.password)
    user = create_user(db, user_data, hashed_password)

    return user


@auth_router.post("/login", response_model=TokenResponse)
async def login_user(login_data: UserLogin, db: Session = Depends(get_db)):
    user = get_user_by_email(db, login_data.email)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": str(user.id)})

    return TokenResponse(access_token=access_token, token_type="bearer")


# TODO: Implement these endpoints in future phases
@auth_router.post("/logout")
async def logout_user():
    """Logout user (for JWT, this is typically handled client-side)"""
    return {"message": "Logged out successfully"}

@auth_router.post("/refresh-token")
async def refresh_token():
    """Refresh an expired access token"""
    return {"message": "Token refreshed successfully"}

@auth_router.post("/verify-email")
async def verify_email():
    """Send email verification link"""
    return {"message": "Email verification link sent"}

