from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.crud.workspace_crud import get_user_workspaces
from app.core.security import get_current_user_id, get_current_user
from app.db.base import get_db
import uuid

workspace_router = APIRouter(prefix="/workspaces", tags=["Workspaces"])

#TODO: Setup logic for each of these routes
@workspace_router.get("/")
async def list_workspaces(
    user_id: uuid.UUID = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    workspace = get_user_workspaces(db, user_id)
    if workspace is None:
        return {
            "message": f"No workspaces found for user {user_id}"
        }

    return {
        "message": "List of workspaces",
        "workspaces": workspace
    }


@workspace_router.get("/me")
async def get_my_workspace(user = Depends(get_current_user)):
    return {
        "message": "Your workspace",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "username": user.username
        }
    }