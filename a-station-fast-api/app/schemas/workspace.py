import uuid
from pydantic import BaseModel

class WorkspaceCreate(BaseModel):
    name: str

class WorkspaceRead(BaseModel):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID

    class Config:
        orm_mode = True