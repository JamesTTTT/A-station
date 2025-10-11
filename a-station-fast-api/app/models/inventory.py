import uuid
from email.policy import default
from sqlalchemy import String, ForeignKey, Integer, JSON, Boolean, Text, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from .base import TimestampedUUIDModel, Base

inventory_group_association = Table(
    "inventory_group_association",
    Base.metadata,
    Column("parent_group_id", ForeignKey("inventory_groups.id"), primary_key=True),
    Column("child_group_id", ForeignKey("inventory_groups.id"), primary_key=True),
)

class Credential(TimestampedUUIDModel):
    __tablename__ = "credentials"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"))
    vault_path: Mapped[str] = mapped_column(String, nullable=False)
    credential_type: Mapped[str] = mapped_column(String(50), default="ssh")

class Variable(TimestampedUUIDModel):
    __tablename__ = "variables"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(Text)
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"))
    inventory_group_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("inventory_groups.id"))

    inventory_group: Mapped[Optional["InventoryGroup"]] = relationship("InventoryGroup", back_populates="variables")

class Host(TimestampedUUIDModel):
    __tablename__ = "hosts"

    alias: Mapped[str] = mapped_column(String(100))
    hostname: Mapped[str] = mapped_column(String(200))
    port: Mapped[int] = mapped_column(Integer, default=22)
    username: Mapped[str] = mapped_column(String(100))

    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"))
    credential_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("credentials.id"))
    inventory_group_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("inventory_groups.id"))

    variables: Mapped[dict] = mapped_column(JSON, default=dict)

    inventory_group: Mapped[Optional["InventoryGroup"]] = relationship("InventoryGroup", back_populates="hosts")


class InventoryGroup(TimestampedUUIDModel):
    __tablename__ = "inventory_groups"
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    workspace_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("workspaces.id"))
    group_variables: Mapped[dict] = mapped_column(JSON, default=dict)

    # Relationships
    hosts: Mapped[List["Host"]] = relationship("Host", back_populates="inventory_group")
    variables: Mapped[List["Variable"]] = relationship("Variable", back_populates="inventory_group")

    parent_groups: Mapped[List["InventoryGroup"]] = relationship(
        "InventoryGroup",
        secondary=inventory_group_association,
        primaryjoin="InventoryGroup.id == inventory_group_association.c.child_group_id",
        secondaryjoin="InventoryGroup.id == inventory_group_association.c.parent_group_id",
        back_populates="child_groups",
    )

    child_groups: Mapped[List["InventoryGroup"]] = relationship(
        "InventoryGroup",
        secondary=inventory_group_association,
        primaryjoin="InventoryGroup.id == inventory_group_association.c.parent_group_id",
        secondaryjoin="InventoryGroup.id == inventory_group_association.c.child_group_id",
        back_populates="parent_groups",
    )