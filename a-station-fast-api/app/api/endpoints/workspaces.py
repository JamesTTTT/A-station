from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.crud.workspace_crud import get_user_workspaces, create_workspace
from app.core.security import get_current_user_id
from app.db.base import get_db
import uuid
from app.schemas.workspace import WorkspaceRead, WorkspaceCreate, WorkspaceUpdate
from app.service.workspace_service import WorkspaceService

workspace_router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

@workspace_router.get("/")
async def list_workspaces(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    workspaces = get_user_workspaces(db, user_id)
    if workspaces is None:
        return []

    return workspaces

@workspace_router.post("/create", response_model=WorkspaceRead, status_code=status.HTTP_201_CREATED)
async def register_workspace(
        workspace_data: WorkspaceCreate,
        user_id: uuid.UUID = Depends(get_current_user_id),
        db: Session = Depends(get_db),
):
    workspace = create_workspace(db, workspace_data, user_id)
    return workspace

@workspace_router.put("/update", response_model=WorkspaceRead, status_code=status.HTTP_200_OK)
async def modify_workspace(
        workspace_id: uuid.UUID,
        workspace_data: WorkspaceUpdate,
        user_id: uuid.UUID = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    workspace_service = WorkspaceService(db)
    workspace = workspace_service.update_workspace(workspace_id, workspace_data, user_id)

    if workspace is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or not authorized to update"
        )
    return workspace


@workspace_router.delete("/delete", response_model=WorkspaceRead, status_code=status.HTTP_200_OK)
async def remove_workspace(
        workspace_id: uuid.UUID,
        user_id: uuid.UUID = Depends(get_current_user_id),
        db: Session = Depends(get_db)
):
    workspace_service = WorkspaceService(db)
    deleted_workspace = workspace_service.delete_workspace(workspace_id, user_id)
    if not deleted_workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found or not authorized to delete"
        )

    return deleted_workspace
