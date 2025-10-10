import uuid
from pydantic import BaseModel

class PlaybookCreate(BaseModel):
    name: str
    yaml_content: str

class PlaybookRead(BaseModel):
    id: uuid.UUID
    name: str

    class Config:
        orm_mode = True