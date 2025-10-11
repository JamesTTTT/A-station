from pydantic import EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.user import User
from app.schemas.user import UserCreate
import uuid
from typing import Optional, Any


def get_user(db: Session, user_id: uuid.UUID) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: EmailStr) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email_or_username(db: Session, identifier: str) -> Optional[User]:
    return db.query(User).filter(
        or_(User.email == identifier, User.username == identifier)
    ).first()


def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[type[User]]:
    return db.query(User).offset(skip).limit(limit).all()


def create_user(db: Session, user: UserCreate, hashed_password: str) -> User:
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user(db: Session, user_id: uuid.UUID, **kwargs) -> Optional[User]:
    db_user = get_user(db, user_id)
    if db_user:
        for key, value in kwargs.items():
            if hasattr(db_user, key) and value is not None:
                setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user


def delete_user(db: Session, user_id: uuid.UUID) -> bool:
    db_user = get_user(db, user_id)
    if db_user:
        db.delete(db_user)
        db.commit()
        return True
    return False


def user_exists(db: Session, email: EmailStr = None, username: str = None) -> bool:
    query = db.query(User)

    if email and username:
        return query.filter(
            or_(User.email == email, User.username == username)
        ).first() is not None
    elif email:
        return query.filter(User.email == email).first() is not None
    elif username:
        return query.filter(User.username == username).first() is not None

    return False