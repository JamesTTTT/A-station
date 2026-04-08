from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.project_source import ProjectSource
from app.schemas.project_source import ProjectSourceCreate, ProjectSourceUpdate


def create_project_source(db: Session, source_data: ProjectSourceCreate, workspace_id: UUID, local_path: str) -> ProjectSource:
    source = ProjectSource(
        workspace_id=workspace_id,
        name=source_data.name,
        source_type=source_data.source_type,
        local_path=local_path,
        git_url=source_data.git_url,
        git_branch=source_data.git_branch,
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


def get_project_source(db: Session, source_id: UUID) -> ProjectSource | None:
    return db.query(ProjectSource).filter(ProjectSource.id == source_id).first()


def get_project_sources_by_workspace(db: Session, workspace_id: UUID) -> list[ProjectSource]:
    return db.query(ProjectSource).filter(ProjectSource.workspace_id == workspace_id).all()


def update_project_source(db: Session, source_id: UUID, update_data: ProjectSourceUpdate) -> ProjectSource | None:
    source = get_project_source(db, source_id)
    if not source:
        return None
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(source, key, value)
    db.commit()
    db.refresh(source)
    return source


def update_last_synced(db: Session, source_id: UUID) -> ProjectSource | None:
    source = get_project_source(db, source_id)
    if not source:
        return None
    source.last_synced_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(source)
    return source


def delete_project_source(db: Session, source_id: UUID) -> bool:
    source = get_project_source(db, source_id)
    if not source:
        return False
    db.delete(source)
    db.commit()
    return True
