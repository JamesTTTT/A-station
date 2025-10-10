import uuid
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserRead(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str

    class Config:
        orm_mode = True