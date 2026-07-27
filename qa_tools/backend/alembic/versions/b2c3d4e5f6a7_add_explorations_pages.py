"""Add explorations and pages tables

Revision ID: b2c3d4e5f6a7
Revises: 448769aa307c
Create Date: 2026-07-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = '448769aa307c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add explorations and pages tables."""
    op.create_table('explorations',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('project_id', sa.UUID(), nullable=False),
        sa.Column('environment_id', sa.UUID(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('progress', sa.Integer(), nullable=False),
        sa.Column('discovered_modules', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['environment_id'], ['environments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_explorations_project_id'), 'explorations', ['project_id'], unique=False)

    op.create_table('pages',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('exploration_id', sa.UUID(), nullable=False),
        sa.Column('url', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('page_name', sa.String(), nullable=True),
        sa.Column('dom_snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['exploration_id'], ['explorations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_pages_exploration_id'), 'pages', ['exploration_id'], unique=False)


def downgrade() -> None:
    """Remove explorations and pages tables."""
    op.drop_index(op.f('ix_pages_exploration_id'), table_name='pages')
    op.drop_table('pages')
    op.drop_index(op.f('ix_explorations_project_id'), table_name='explorations')
    op.drop_table('explorations')
