from uuid import UUID
from pydantic import BaseModel, Field
from typing import Dict

from app.schemas.base import TimestampedUUIDSchema


class CredentialCreate(BaseModel):
    """Schema for creating credentials (SSH keys)"""
    name: str = Field(..., min_length=1, max_length=100)
    private_key: str = Field(..., min_length=1)
    credential_type: str = "ssh"


class CredentialRead(TimestampedUUIDSchema):
    """Schema for reading credentials"""
    name: str
    credential_type: str
    workspace_id: UUID


class HostCreate(BaseModel):
    """Schema for creating a host"""
    alias: str = Field(..., min_length=1, max_length=100)
    hostname: str = Field(..., min_length=1, max_length=200)
    port: int = Field(default=22, ge=1, le=65535)
    username: str = Field(..., min_length=1, max_length=100)
    credential_id: UUID | None = None
    variables: Dict[str, str] = Field(default_factory=dict)


class HostUpdate(BaseModel):
    """Schema for updating a host"""
    alias: str | None = Field(None, min_length=1, max_length=100)
    hostname: str | None = Field(None, min_length=1, max_length=200)
    port: int | None = Field(None, ge=1, le=65535)
    username: str | None = Field(None, min_length=1, max_length=100)
    credential_id: UUID | None = None
    variables: Dict[str, str] | None = None


class HostRead(TimestampedUUIDSchema):
    """Schema for reading host data"""
    alias: str
    hostname: str
    port: int
    username: str
    workspace_id: UUID
    credential_id: UUID | None = None
    inventory_group_id: UUID | None = None
    variables: Dict[str, str]


class InventoryGroupCreate(BaseModel):
    """Schema for creating an inventory group"""
    name: str = Field(..., min_length=1, max_length=100)
    group_variables: Dict[str, str] = Field(default_factory=dict)


class InventoryGroupRead(TimestampedUUIDSchema):
    """Schema for reading inventory group data"""
    name: str
    workspace_id: UUID
    group_variables: Dict[str, str]


class VariableCreate(BaseModel):
    """Schema for creating a variable"""
    name: str = Field(..., min_length=1, max_length=100)
    value: str
    is_sensitive: bool = False


class VariableRead(TimestampedUUIDSchema):
    """Schema for reading variable data"""
    name: str
    value: str
    is_sensitive: bool
    workspace_id: UUID
    inventory_group_id: UUID | None = None