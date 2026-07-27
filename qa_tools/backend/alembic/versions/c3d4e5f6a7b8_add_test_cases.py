"""Add test_cases table

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-07-23

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'test_cases',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('exploration_id', sa.UUID(), nullable=False),
        sa.Column('page_id', sa.UUID(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('priority', sa.String(), nullable=False, server_default='MEDIUM'),
        sa.Column('test_type', sa.String(), nullable=False, server_default='FUNCTIONAL'),
        sa.Column('steps', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('expected_result', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='DRAFT'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['exploration_id'], ['explorations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['page_id'], ['pages.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_test_cases_exploration_id', 'test_cases', ['exploration_id'])
    op.create_index('ix_test_cases_status', 'test_cases', ['status'])


def downgrade() -> None:
    op.drop_index('ix_test_cases_status', table_name='test_cases')
    op.drop_index('ix_test_cases_exploration_id', table_name='test_cases')
    op.drop_table('test_cases')
