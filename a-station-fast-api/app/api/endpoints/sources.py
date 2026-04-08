import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_current_user
from app.crud.project_source_crud import (
    create_project_source,
    delete_project_source,
    get_project_source,
    get_project_sources_by_workspace,
    update_last_synced,
)
from app.crud.workspace_crud import get_workspace, is_workspace_member
from app.db.base import get_db
from app.models.project_source import SourceType
from app.models.user import User
from app.schemas.project_source import ProjectSourceCreate, ProjectSourceRead
from app.service.source_service import (
    build_file_tree,
    detect_and_parse_inventory,
    git_clone,
    git_pull,
    read_file_content,
    remove_source_directory,
)

sources_router = APIRouter(tags=["Sources"])


def _verify_workspace_access(
    workspace_id: uuid.UUID, user: User, db: Session
) -> None:
    workspace = get_workspace(db, workspace_id)
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Workspace not found"
        )
    if not is_workspace_member(db, workspace_id, user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this workspace",
        )


# ── Sources CRUD ──────────────────────────────────────────────────────────────


@sources_router.post(
    "/workspaces/{workspace_id}/sources",
    response_model=ProjectSourceRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_source(
    workspace_id: uuid.UUID,
    source_data: ProjectSourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new project source (clone if git, validate path if local)."""
    _verify_workspace_access(workspace_id, current_user, db)

    if source_data.source_type == SourceType.GIT:
        storage_path = os.path.join(
            settings.SOURCE_STORAGE_PATH, str(workspace_id), str(uuid.uuid4())
        )
        try:
            git_clone(source_data.git_url, storage_path, source_data.git_branch or "main")
        except RuntimeError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Git clone failed: {exc}",
            )
        local_path = storage_path
    else:
        # Local source – validate the path exists
        if not source_data.local_path or not os.path.isdir(source_data.local_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="local_path must point to an existing directory",
            )
        local_path = source_data.local_path

    source = create_project_source(db, source_data, workspace_id, local_path)
    return source


@sources_router.get(
    "/workspaces/{workspace_id}/sources",
    response_model=list[ProjectSourceRead],
)
async def list_sources(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all project sources for a workspace."""
    _verify_workspace_access(workspace_id, current_user, db)
    return get_project_sources_by_workspace(db, workspace_id)


@sources_router.get(
    "/workspaces/{workspace_id}/sources/{source_id}",
    response_model=ProjectSourceRead,
)
async def get_source(
    workspace_id: uuid.UUID,
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single project source."""
    _verify_workspace_access(workspace_id, current_user, db)

    source = get_project_source(db, source_id)
    if not source or source.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )
    return source


@sources_router.delete(
    "/workspaces/{workspace_id}/sources/{source_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_source(
    workspace_id: uuid.UUID,
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a project source (removes cloned directory for git sources)."""
    _verify_workspace_access(workspace_id, current_user, db)

    source = get_project_source(db, source_id)
    if not source or source.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    if source.source_type == SourceType.GIT:
        remove_source_directory(source.local_path)

    delete_project_source(db, source_id)
    return None


# ── Sync ──────────────────────────────────────────────────────────────────────


@sources_router.post(
    "/workspaces/{workspace_id}/sources/{source_id}/sync",
    response_model=ProjectSourceRead,
)
async def sync_source(
    workspace_id: uuid.UUID,
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Git pull the latest changes for a git source."""
    _verify_workspace_access(workspace_id, current_user, db)

    source = get_project_source(db, source_id)
    if not source or source.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    if source.source_type != SourceType.GIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sync is only supported for git sources",
        )

    try:
        git_pull(source.local_path)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Git pull failed: {exc}",
        )

    updated = update_last_synced(db, source_id)
    return updated


# ── File browser ──────────────────────────────────────────────────────────────


@sources_router.get(
    "/workspaces/{workspace_id}/sources/{source_id}/tree",
)
async def source_file_tree(
    workspace_id: uuid.UUID,
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the file tree for a source."""
    _verify_workspace_access(workspace_id, current_user, db)

    source = get_project_source(db, source_id)
    if not source or source.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    try:
        return build_file_tree(source.local_path)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Path traversal denied"
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Path not found"
        )


@sources_router.get(
    "/workspaces/{workspace_id}/sources/{source_id}/file",
)
async def source_file_content(
    workspace_id: uuid.UUID,
    source_id: uuid.UUID,
    path: str = Query(..., description="Relative path within the source"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the content of a file within a source."""
    _verify_workspace_access(workspace_id, current_user, db)

    source = get_project_source(db, source_id)
    if not source or source.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    try:
        content = read_file_content(source.local_path, path)
        return {"path": path, "content": content}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Path traversal denied"
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )


# ── Inventory ─────────────────────────────────────────────────────────────────


@sources_router.get(
    "/workspaces/{workspace_id}/sources/{source_id}/inventory",
)
async def source_inventory(
    workspace_id: uuid.UUID,
    source_id: uuid.UUID,
    path: str = Query(None, description="Relative inventory path (optional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parse and return inventory data from a source."""
    _verify_workspace_access(workspace_id, current_user, db)

    source = get_project_source(db, source_id)
    if not source or source.workspace_id != workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    try:
        return detect_and_parse_inventory(source.local_path, path)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Path traversal denied"
        )
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="File not found"
        )
