"""strip inventory add project sources

Revision ID: 5cddd29a6ffb
Revises: e7c65c9da781
Create Date: 2026-04-08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = '5cddd29a6ffb'
down_revision = 'e7c65c9da781'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create project_sources table
    op.create_table(
        'project_sources',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('source_type', sa.Enum('git', 'local', name='sourcetype'), nullable=False),
        sa.Column('local_path', sa.String(), nullable=False),
        sa.Column('git_url', sa.String(), nullable=True),
        sa.Column('git_branch', sa.String(100), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # 2. Drop old jobs table (has FK to playbooks being dropped)
    op.drop_table('jobs')

    # 3. Drop old inventory/playbook tables
    op.drop_table('variables')
    op.drop_table('inventory_group_association')
    op.drop_table('hosts')
    op.drop_table('playbooks')
    op.drop_table('inventory_groups')
    op.drop_table('credentials')

    # 4. Recreate jobs table with new schema
    op.create_table(
        'jobs',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('workspace_id', UUID(as_uuid=True), nullable=False),
        sa.Column('source_id', UUID(as_uuid=True), nullable=False),
        sa.Column('playbook_path', sa.String(), nullable=False),
        sa.Column('inventory_path', sa.String(), nullable=False),
        sa.Column('extra_vars', JSONB(), nullable=True),
        sa.Column('triggered_by_id', UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('log_output', sa.Text(), nullable=True),
        sa.Column('ansible_version', sa.String(10), nullable=False),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.ForeignKeyConstraint(['source_id'], ['project_sources.id']),
        sa.ForeignKeyConstraint(['triggered_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    # 1. Drop new jobs table
    op.drop_table('jobs')

    # 2. Drop project_sources table
    op.drop_table('project_sources')

    # 3. Drop the sourcetype enum
    sa.Enum('git', 'local', name='sourcetype').drop(op.get_bind(), checkfirst=True)

    # 4. Recreate old tables
    op.create_table(
        'credentials',
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('workspace_id', UUID(as_uuid=True), nullable=False),
        sa.Column('vault_path', sa.String(), nullable=False),
        sa.Column('credential_type', sa.String(50), nullable=False),
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'inventory_groups',
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('workspace_id', UUID(as_uuid=True), nullable=False),
        sa.Column('group_variables', sa.JSON(), nullable=False),
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'playbooks',
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('yaml_content', sa.Text(), nullable=False),
        sa.Column('workspace_id', UUID(as_uuid=True), nullable=False),
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'hosts',
        sa.Column('alias', sa.String(100), nullable=False),
        sa.Column('hostname', sa.String(200), nullable=False),
        sa.Column('port', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(100), nullable=False),
        sa.Column('workspace_id', UUID(as_uuid=True), nullable=False),
        sa.Column('credential_id', UUID(as_uuid=True), nullable=True),
        sa.Column('inventory_group_id', UUID(as_uuid=True), nullable=True),
        sa.Column('variables', sa.JSON(), nullable=False),
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['credential_id'], ['credentials.id']),
        sa.ForeignKeyConstraint(['inventory_group_id'], ['inventory_groups.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'inventory_group_association',
        sa.Column('parent_group_id', UUID(as_uuid=True), nullable=False),
        sa.Column('child_group_id', UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['child_group_id'], ['inventory_groups.id']),
        sa.ForeignKeyConstraint(['parent_group_id'], ['inventory_groups.id']),
        sa.PrimaryKeyConstraint('parent_group_id', 'child_group_id'),
    )

    op.create_table(
        'variables',
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('is_sensitive', sa.Boolean(), nullable=False),
        sa.Column('workspace_id', UUID(as_uuid=True), nullable=False),
        sa.Column('inventory_group_id', UUID(as_uuid=True), nullable=True),
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['inventory_group_id'], ['inventory_groups.id']),
        sa.ForeignKeyConstraint(['workspace_id'], ['workspaces.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Recreate old jobs table (with FK to playbooks)
    op.create_table(
        'jobs',
        sa.Column('playbook_id', UUID(as_uuid=True), nullable=False),
        sa.Column('triggered_by_id', UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('log_output', sa.Text(), nullable=True),
        sa.Column('ansible_version', sa.String(10), nullable=False),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['playbook_id'], ['playbooks.id']),
        sa.ForeignKeyConstraint(['triggered_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
