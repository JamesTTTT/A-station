from uuid import UUID
from typing import List
from pydantic import BaseModel, Field

from app.schemas.base import TimestampedUUIDSchema


class WorkspaceCreate(BaseModel):
    """Schema for creating a workspace"""
    name: str = Field(..., min_length=1, max_length=255)

    model_config = {"json_schema_extra":{
        "examples": [
            {
                "name": "My Workspace"
            }
        ]
    }}


class WorkspaceUpdate(BaseModel):
    """Schema for updating a workspace"""
    name: str | None = Field(None, min_length=1, max_length=255)


class WorkspaceRead(TimestampedUUIDSchema):
    """Schema for reading basic workspace data"""
    name: str
    owner_id: UUID


class WorkspaceMemberInfo(BaseModel):
    """Schema for workspace member information"""
    user_id: UUID
    username: str
    email: str
    role: str


class WorkspaceWithMembers(WorkspaceRead):
    """Schema for workspace with member details"""
    members: List[WorkspaceMemberInfo] = []


class WorkspaceMemberAdd(BaseModel):
    """Schema for adding a member to workspace"""
    user_id: UUID
    role: str = Field(default="MEMBER", pattern="^(OWNER|ADMIN|MEMBER|VIEWER)$")


class WorkspaceMemberRemove(BaseModel):
    """Schema for removing a member from workspace"""
    user_id: UUID


class WorkspaceMemberRoleUpdate(BaseModel):
    """Schema for updating a member's role"""
    user_id: UUID
    role: str = Field(..., pattern="^(OWNER|ADMIN|MEMBER|VIEWER)$")