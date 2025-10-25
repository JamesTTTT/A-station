from pydantic import BaseModel

class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str