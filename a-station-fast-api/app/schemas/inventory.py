import uuid
from pydantic import BaseModel
from typing import Optional, Dict

class CredentialCreate(BaseModel):
    name: str
    private_key: str
    credential_type: str = "ssh"

class CredentialRead(BaseModel):
    id: uuid.UUID
    name: str
    credential_type: str

    class Config:
        orm_mode = True

class HostCreate(BaseModel):
    alias: str
    hostname: str
    port: int = 22
    username: str
    credential_id: Optional[uuid.UUID] = None
    variables: Optional[Dict] = {}

class HostRead(BaseModel):
    id: uuid.UUID
    alias: str
    hostname: str
    port: int
    username: str

    class Config:
        orm_mode = True