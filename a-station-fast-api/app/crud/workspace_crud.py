from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from app.models.workspace import Workspace
from app.models.workspace_member import WorkspaceMember
from app.models.user import User
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
import uuid
from typing import Optional, List, Any


def get_workspace(db: Session, workspace_id: uuid.UUID) -> Optional[Workspace]:
    return db.query(Workspace).filter(Workspace.id == workspace_id).first()


def get_workspace_by_id(db: Session, workspace_id: str) -> Optional[Workspace]:
    try:
        uuid_obj = uuid.UUID(workspace_id)
        return get_workspace(db, uuid_obj)
    except (ValueError, AttributeError):
        return None


def get_workspace_with_members(db: Session, workspace_id: uuid.UUID) -> Optional[Workspace]:
    return (
        db.query(Workspace)
        .options(
            joinedload(Workspace.member_associations).joinedload(WorkspaceMember.user),
            joinedload(Workspace.owner)
        )
        .filter(Workspace.id == workspace_id)
        .first()
    )


def get_user_workspaces(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[type[Workspace]]:
    return (
        db.query(Workspace)
        .join(WorkspaceMember)
        .filter(WorkspaceMember.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_owned_workspaces(db: Session, user_id: uuid.UUID, skip: int = 0, limit: int = 100) -> list[type[Workspace]]:
    return (
        db.query(Workspace)
        .filter(Workspace.owner_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def create_workspace(db: Session, workspace_data: WorkspaceCreate, owner_id: uuid.UUID) -> Workspace:
    db_workspace = Workspace(
        name=workspace_data.name,
        owner_id=owner_id
    )
    db.add(db_workspace)
    db.flush()
    owner_membership = WorkspaceMember(
        workspace_id=db_workspace.id,
        user_id=owner_id,
        role="OWNER"
    )
    db.add(owner_membership)

    db.commit()
    db.refresh(db_workspace)
    return db_workspace


def update_workspace(db: Session, workspace_id: uuid.UUID, workspace_data: WorkspaceUpdate) -> Optional[Workspace]:
    db_workspace = get_workspace(db, workspace_id)
    if db_workspace:
        update_data = workspace_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if hasattr(db_workspace, key) and value is not None:
                setattr(db_workspace, key, value)
        db.commit()
        db.refresh(db_workspace)
    return db_workspace


def delete_workspace(db: Session, workspace_id: uuid.UUID) -> bool:
    db_workspace = get_workspace(db, workspace_id)
    if db_workspace:
        db.delete(db_workspace)
        db.commit()
        return True
    return False


def workspace_exists(db: Session, name: str, owner_id: uuid.UUID) -> bool:
    return (
        db.query(Workspace)
        .filter(Workspace.name == name, Workspace.owner_id == owner_id)
        .first() is not None
    )


def get_workspace_member(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID) -> Optional[WorkspaceMember]:
    """Get a specific workspace member"""
    return (
        db.query(WorkspaceMember)
        .filter(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id
        )
        .first()
    )


def get_workspace_members(db: Session, workspace_id: uuid.UUID) -> list[type[WorkspaceMember]]:
    return (
        db.query(WorkspaceMember)
        .options(joinedload(WorkspaceMember.user))
        .filter(WorkspaceMember.workspace_id == workspace_id)
        .all()
    )


def add_workspace_member(
    db: Session,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    role: str = "MEMBER"
) -> Optional[WorkspaceMember]:

    existing_member = get_workspace_member(db, workspace_id, user_id)
    if existing_member:
        return None

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    db_member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user_id,
        role=role
    )
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member


def remove_workspace_member(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    db_member = get_workspace_member(db, workspace_id, user_id)
    if db_member:
        db.delete(db_member)
        db.commit()
        return True
    return False


def update_member_role(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID, role: str) -> Optional[WorkspaceMember]:
    db_member = get_workspace_member(db, workspace_id, user_id)
    if db_member:
        db_member.role = role
        db.commit()
        db.refresh(db_member)
    return db_member


def is_workspace_member(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    return get_workspace_member(db, workspace_id, user_id) is not None


def get_member_role(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID) -> Optional[str]:
    member = get_workspace_member(db, workspace_id, user_id)
    return member.role if member else None


def user_has_permission(db: Session, workspace_id: uuid.UUID, user_id: uuid.UUID, required_role: str) -> bool:
    role_hierarchy = {
        "VIEWER": 1,
        "MEMBER": 2,
        "ADMIN": 3,
        "OWNER": 4
    }

    member_role = get_member_role(db, workspace_id, user_id)
    if not member_role:
        return False

    return role_hierarchy.get(member_role, 0) >= role_hierarchy.get(required_role, 0)