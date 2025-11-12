from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.models.user import User
from app.schemas.playbook import PlaybookCreate, PlaybookRead, PlaybookUpdate
from app.crud import playbook_crud, workspace_crud
from app.utils.validators import validate_ansible_playbook

from app.core.security import get_current_user
from app.db.base import get_db

playbook_router = APIRouter(tags=["Playbooks"])

async def verify_workspace_access(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> None:
    """Verify user has access to workspace"""
    workspace = workspace_crud.get_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )

    is_member = workspace_crud.is_workspace_member(db, workspace_id, current_user.id)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this workspace"
        )


@playbook_router.get("/workspaces/{workspace_id}/playbooks", response_model=list[PlaybookRead])
async def list_playbooks(
    workspace_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await verify_workspace_access(workspace_id, current_user, db)

    playbooks = playbook_crud.get_playbooks_by_workspace(db, workspace_id, skip, limit)
    return playbooks

@playbook_router.get("/workspaces/{workspace_id}/playbooks/{playbook_id}", response_model=PlaybookRead)
async def get_playbook(
    workspace_id: UUID,
    playbook_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific playbook"""
    await verify_workspace_access(workspace_id, current_user, db)

    playbook = playbook_crud.get_playbook(db, playbook_id)
    if not playbook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playbook not found"
        )

    if playbook.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Playbook does not belong to this workspace"
        )

    return playbook

@playbook_router.post("/workspaces/{workspace_id}/playbooks", response_model=PlaybookRead, status_code=status.HTTP_201_CREATED)
async def create_playbook(
    workspace_id: UUID,
    playbook: PlaybookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new playbook"""
    await verify_workspace_access(workspace_id, current_user, db)

    validate_ansible_playbook(playbook.yaml_content)

    playbook_new = playbook_crud.create_playbook(db, playbook, workspace_id)
    return playbook_new

@playbook_router.patch("/workspaces/{workspace_id}/playbooks/{playbook_id}", response_model=PlaybookRead)
async def update_playbook(
        workspace_id: UUID,
        playbook_id: UUID,
        playbook_update: PlaybookUpdate,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Update an existing playbook"""
    await verify_workspace_access(workspace_id, current_user, db)
    existing_playbook = playbook_crud.get_playbook(db, playbook_id)
    if not existing_playbook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playbook not found"
        )
    if existing_playbook.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Playbook does not belong to this workspace"
        )

    if playbook_update.yaml_content is not None:
        validate_ansible_playbook(playbook_update.yaml_content)

    updated_playbook = playbook_crud.update_playbook(db, playbook_id, playbook_update)
    return updated_playbook

@playbook_router.delete("/workspaces/{workspace_id}/playbooks/{playbook_id}")
async def delete_playbook(
    workspace_id: UUID,
    playbook_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a playbook"""
    await verify_workspace_access(workspace_id, current_user, db)

    existing_playbook = playbook_crud.get_playbook(db, playbook_id)
    if not existing_playbook:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Playbook not found"
        )

    if existing_playbook.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Playbook does not belong to this workspace"
        )

    # Clean up jobs
    if existing_playbook.jobs:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete playbook with associated jobs"
        )

    playbook_crud.delete_playbook(db, playbook_id)
    return {"message": "Playbook deleted successfully"}