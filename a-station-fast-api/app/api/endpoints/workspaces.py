from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.crud.workspace_crud import get_user_workspaces, create_workspace, get_workspace
from app.core.security import get_current_user_id
from app.db.base import get_db
import uuid
from app.schemas.workspace import (
    WorkspaceRead,
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceWithMembers,
    WorkspaceMemberInfo,
    WorkspaceMemberAdd,
    WorkspaceMemberRoleUpdate
)
from app.service.workspace_service import WorkspaceService

workspace_router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@workspace_router.get("/", response_model=list[WorkspaceRead])
async def list_workspaces(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """List all workspaces the current user is a member of"""
    workspaces = get_user_workspaces(db, user_id)
    if workspaces is None:
        return []
    return workspaces

@workspace_router.post("/", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
async def create_new_workspace(
    workspace_data: WorkspaceCreate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Create a new workspace (user becomes owner)"""
    workspace = create_workspace(db, workspace_data, user_id)
    return workspace

@workspace_router.get("/{workspace_id}", response_model=WorkspaceWithMembers)
async def get_workspace_details(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a specific workspace with member details"""
    workspace_service = WorkspaceService(db)
    workspace = workspace_service.get_workspace_by_id(workspace_id, user_id)

    if workspace is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or not authorized to view"
        )

    members = [
        WorkspaceMemberInfo(
            user_id=member.user_id,
            username=member.user.username,
            email=member.user.email,
            role=member.role
        )
        for member in workspace.member_associations
    ]

    return WorkspaceWithMembers(
        id=workspace.id,
        name=workspace.name,
        owner_id=workspace.owner_id,
        created_at=workspace.created_at,
        updated_at=workspace.updated_at,
        members=members
    )

@workspace_router.put("/{workspace_id}", response_model=WorkspaceRead)
async def update_workspace(
    workspace_id: uuid.UUID,
    workspace_data: WorkspaceUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a workspace (owner only)"""
    workspace_service = WorkspaceService(db)
    workspace = workspace_service.update_workspace(workspace_id, workspace_data, user_id)

    if workspace is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or not authorized to update"
        )
    return workspace

@workspace_router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Delete a workspace (owner only)"""
    workspace_service = WorkspaceService(db)
    deleted = workspace_service.delete_workspace(workspace_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or not authorized to delete"
        )
    return None

# Member Management Endpoints

@workspace_router.get("/{workspace_id}/members", response_model=list[WorkspaceMemberInfo])
async def list_workspace_members(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """List all members of a workspace"""
    workspace_service = WorkspaceService(db)
    members = workspace_service.get_workspace_members(workspace_id, user_id)

    if members is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or not authorized to view members"
        )

    return [
        WorkspaceMemberInfo(
            user_id=member.user_id,
            username=member.user.username,
            email=member.user.email,
            role=member.role
        )
        for member in members
    ]

@workspace_router.post("/{workspace_id}/members", response_model=WorkspaceMemberInfo, status_code=status.HTTP_201_CREATED)
async def add_workspace_member(
    workspace_id: uuid.UUID,
    member_data: WorkspaceMemberAdd,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Add a member to a workspace (requires ADMIN role)"""
    workspace_service = WorkspaceService(db)

    from app.crud import workspace_crud

    if not workspace_crud.user_has_permission(db, workspace_id, user_id, "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add members"
        )

    workspace = get_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    member = workspace_crud.add_workspace_member(
        db,
        workspace_id=workspace_id,
        user_id=member_data.user_id,
        role=member_data.role
    )

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already a member or user not found"
        )

    return WorkspaceMemberInfo(
        user_id=member.user_id,
        username=member.user.username,
        email=member.user.email,
        role=member.role
    )

@workspace_router.delete("/{workspace_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_workspace_member(
    workspace_id: uuid.UUID,
    member_user_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Remove a member from a workspace (requires ADMIN role, cannot remove owner)"""
    workspace_service = WorkspaceService(db)
    removed = workspace_service.remove_member(workspace_id, member_user_id, user_id)

    if not removed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove member, member not found, or cannot remove owner"
        )
    return None

@workspace_router.patch("/{workspace_id}/members/{member_user_id}/role", response_model=WorkspaceMemberInfo)
async def update_member_role(
    workspace_id: uuid.UUID,
    member_user_id: uuid.UUID,
    role_data: WorkspaceMemberRoleUpdate,
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Update a member's role (requires ADMIN role, cannot change owner role)"""
    workspace_service = WorkspaceService(db)
    member = workspace_service.update_member_role(
        workspace_id,
        member_user_id,
        role_data.role,
        user_id
    )

    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update role, member not found, or cannot change owner role"
        )

    return WorkspaceMemberInfo(
        user_id=member.user_id,
        username=member.user.username,
        email=member.user.email,
        role=member.role
    )
