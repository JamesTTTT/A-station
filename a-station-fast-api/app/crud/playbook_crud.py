from typing import List, Any

from sqlalchemy.orm import Session
from uuid import UUID
from app.models.playbook import Playbook
from app.schemas.playbook import PlaybookCreate, PlaybookUpdate

def get_playbook(db: Session, playbook_id: UUID) -> Playbook | None:
    return db.query(Playbook).filter(Playbook.id == playbook_id).first()

def get_playbooks_by_workspace(db: Session, workspace_id: UUID, skip: int = 0, limit: int = 100) -> list[
    type[Playbook]]:
    return db.query(Playbook).filter(Playbook.workspace_id == workspace_id).offset(skip).limit(limit).all()

def create_playbook(
    db: Session,
    playbook: PlaybookCreate,
    workspace_id: UUID
) -> Playbook:
    db_playbook = Playbook(
        **playbook.model_dump(),
        workspace_id=workspace_id
    )
    db.add(db_playbook)
    db.commit()
    db.refresh(db_playbook)
    return db_playbook

def update_playbook(
    db: Session,
    playbook_id: UUID,
    playbook: PlaybookUpdate
) -> Playbook | None:
    db_playbook = get_playbook(db, playbook_id)
    if not db_playbook:
        return None

    update_data = playbook.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_playbook, key, value)

    db.commit()
    db.refresh(db_playbook)
    return db_playbook

def delete_playbook(db: Session, playbook_id: UUID) -> bool:
    db_playbook = get_playbook(db, playbook_id)
    if not db_playbook:
        return False

    db.delete(db_playbook)
    db.commit()
    return True