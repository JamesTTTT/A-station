import datetime
from typing import Optional
import uuid
from pydantic import BaseModel

class JobCreate(BaseModel):
    playbook_id: uuid.UUID
    # inventory_id will also be needed here

class JobRead(BaseModel):
    id: uuid.UUID
    playbook_id: uuid.UUID
    status: str
    log_output: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True