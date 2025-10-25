from pydantic import BaseModel, EmailStr, Field

from app.schemas.base import TimestampedUUIDSchema


class UserCreate(BaseModel):
    """Schema for user registration"""
    email: EmailStr = Field(..., examples=["user@example.com"])
    username: str = Field(..., min_length=3, max_length=50, examples=["john_doe"])
    password: str = Field(
        ...,
        min_length=8,
        max_length=72,
        description="Password must be between 8 and 72 characters (bcrypt limitation)",
        examples=["SecurePassword123!"]
    )

    model_config = {"json_schema_extra": {
        "examples": [
            {
                "email": "user@example.com",
                "username": "john_doe",
                "password": "SecurePassword123!"
            }
        ]
    }}


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserRead(TimestampedUUIDSchema):
    """Schema for reading user data (never includes password!)"""
    email: EmailStr
    username: str


class TokenResponse(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = 900

    model_config = {"json_schema_extra": {
        "examples": [
            {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "a1b2c3d4e5f6...",
                "token_type": "bearer",
                "expires_in": 900
            }
        ]
    }}