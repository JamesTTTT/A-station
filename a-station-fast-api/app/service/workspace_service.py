from sqlalchemy.orm import Session
import uuid
from typing import List, Optional

from app.crud import workspace_crud, user_crud
from app.schemas.workspace import WorkspaceCreate, WorkspaceUpdate
from app.models.workspace import Workspace
from app.models.user import User
from app.models.workspace_member import WorkspaceMember
from models import Workspace
from models.workspace_member import WorkspaceMember


class WorkspaceService:

    def __init__(self, db: Session):
        self.db = db


    def get_workspace_by_id(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Workspace]:
        """
        Get a single workspace by its ID.
        Ensures that the user is a member of the workspace.
        """
        if workspace_crud.is_workspace_member(self.db, workspace_id=workspace_id, user_id=user_id):
            return workspace_crud.get_workspace_with_members(self.db, workspace_id=workspace_id)
        return None

    def update_workspace(
        self, workspace_id: uuid.UUID, workspace_data: WorkspaceUpdate, user_id: uuid.UUID
    ) -> Optional[Workspace]:

        workspace = workspace_crud.get_workspace(self.db, workspace_id)

        if workspace and workspace.owner_id == user_id:
            return workspace_crud.update_workspace(self.db, workspace_id=workspace_id, workspace_data=workspace_data)
        return None

    def delete_workspace(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> bool:

        workspace = workspace_crud.get_workspace(self.db, workspace_id)

        if workspace and workspace.owner_id == user_id:
            return workspace_crud.delete_workspace(self.db, workspace_id=workspace_id)
        return False

    def invite_member(
        self, workspace_id: uuid.UUID, user_email: str, role: str, inviter_id: uuid.UUID
    ) -> Optional[WorkspaceMember]:
        """
        Only an ADMIN or higher can invite members.
        """
        if not workspace_crud.user_has_permission(self.db, workspace_id, inviter_id, "ADMIN"):
            return None

        user_to_add = user_crud.get_user_by_email(self.db, email=user_email)
        if not user_to_add:
            return None

        return workspace_crud.add_workspace_member(
            self.db, workspace_id=workspace_id, user_id=user_to_add.id, role=role
        )

    def remove_member(self, workspace_id: uuid.UUID, user_id_to_remove: uuid.UUID, remover_id: uuid.UUID) -> bool:
        """
        Only an ADMIN or higher can remove members.
        """
        if not workspace_crud.user_has_permission(self.db, workspace_id, remover_id, "ADMIN"):
            return False

        member_to_remove = workspace_crud.get_workspace_member(self.db, workspace_id, user_id_to_remove)
        if member_to_remove and member_to_remove.role == "OWNER":
            return False

        return workspace_crud.remove_workspace_member(self.db, workspace_id=workspace_id, user_id=user_id_to_remove)

    def update_member_role(
        self, workspace_id: uuid.UUID, user_id_to_update: uuid.UUID, new_role: str, updater_id: uuid.UUID
    ) -> Optional[WorkspaceMember]:
        """
        Only an ADMIN or OWNER can update roles.
        """
        if not workspace_crud.user_has_permission(self.db, workspace_id, updater_id, "ADMIN"):
            return None

        member_to_update = workspace_crud.get_workspace_member(self.db, workspace_id, user_id_to_update)
        if member_to_update and member_to_update.role == "OWNER":
            return None

        return workspace_crud.update_member_role(
            self.db, workspace_id=workspace_id, user_id=user_id_to_update, role=new_role
        )

    def get_workspace_members(self, workspace_id: uuid.UUID, user_id: uuid.UUID) -> list[type[WorkspaceMember]] | None:
        if workspace_crud.is_workspace_member(self.db, workspace_id=workspace_id, user_id=user_id):
            return workspace_crud.get_workspace_members(self.db, workspace_id=workspace_id)
        return None
