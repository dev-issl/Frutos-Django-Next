"""
Migration: 0013_fix_wholesaleuser_id_sequence_final

Problem: The `id` column of `wholesale_wholesaleuser` has no DEFAULT (no sequence
attached), so every INSERT fails with:
    "null value in column 'id' violates not-null constraint"

Root cause: At some point the sequence was created as a separate SERIAL / identity
column, then dropped/modified, leaving the `id` column without a DEFAULT.

Fix: Recreate a proper sequence and attach it as the DEFAULT for the column.
"""

from django.db import migrations


def fix_sequence(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return  # SQLite / other DBs auto-handle this; nothing to do

    conn = schema_editor.connection
    with conn.cursor() as cursor:
        seq_name = 'wholesale_wholesaleuser_id_seq2'

        # 1. Find the current maximum id (may be NULL if table is empty)
        cursor.execute('SELECT MAX(id) FROM wholesale_wholesaleuser;')
        row = cursor.fetchone()
        max_id = row[0] if row and row[0] is not None else 0
        start_val = max_id + 1

        # 2. Drop old sequence if it exists (from previous attempts)
        cursor.execute(f'DROP SEQUENCE IF EXISTS {seq_name};')

        # 3. Create a fresh bigint sequence starting after the highest existing id
        cursor.execute(
            f'CREATE SEQUENCE {seq_name} '
            f'AS bigint START WITH {start_val} INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;'
        )

        # 4. Set the sequence as the DEFAULT for the id column
        cursor.execute(
            f'ALTER TABLE wholesale_wholesaleuser '
            f'ALTER COLUMN id SET DEFAULT nextval(\'{seq_name}\');'
        )

        # 5. Transfer ownership so the sequence is dropped with the table
        cursor.execute(
            f'ALTER SEQUENCE {seq_name} OWNED BY wholesale_wholesaleuser.id;'
        )


def reverse_fix(apps, schema_editor):
    """Reverse: just remove the default — the column itself stays."""
    if schema_editor.connection.vendor != 'postgresql':
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute(
            'ALTER TABLE wholesale_wholesaleuser ALTER COLUMN id DROP DEFAULT;'
        )
        cursor.execute('DROP SEQUENCE IF EXISTS wholesale_wholesaleuser_id_seq2;')


class Migration(migrations.Migration):

    dependencies = [
        ('wholesale', '0012_remove_wholesaleuser_serial_number'),
    ]

    operations = [
        migrations.RunPython(fix_sequence, reverse_code=reverse_fix),
    ]
