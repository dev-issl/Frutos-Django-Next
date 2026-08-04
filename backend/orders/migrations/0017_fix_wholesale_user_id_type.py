"""
Migration 0017 - Fix wholesale_user_id type mismatch

Scenarios handled:
  A) Local / already-fixed DB:
     - wholesale_wholesaleuser.id = bigint
     - referencing cols = bigint  → nothing to do

  B) Production DB (the failing case):
     - wholesale_wholesaleuser.id = uuid
     - referencing cols = bigint  → convert referencing cols to uuid

  C) Old scenario (pre-fix):
     - wholesale_wholesaleuser.id = uuid
     - referencing cols = uuid    → convert referencing cols to bigint
       (This was the original intent but wrong — skipped in favour of B)

Strategy for scenario B (production):
  The referenced table's PK is UUID, so the FK column must also be UUID.
  We convert wholesale_user_id (bigint) → uuid (NULL for all rows, since
  it is nullable). Then we add the FK constraint.
"""
from django.db import migrations


def fix_wholesale_fk(apps, schema_editor):
    if schema_editor.connection.vendor != 'postgresql':
        return

    tables_to_fix = [
        ('orders_order', 'wholesale_user_id'),
        ('accounts_supportticket', 'wholesale_user_id'),
        ('accounts_supportticketmessage', 'wholesale_sender_id'),
    ]

    with schema_editor.connection.cursor() as cursor:

        # ── Detect the actual type of wholesale_wholesaleuser.id ──────────
        cursor.execute("""
            SELECT data_type
            FROM information_schema.columns
            WHERE table_name = 'wholesale_wholesaleuser'
              AND column_name = 'id'
        """)
        row = cursor.fetchone()
        if not row:
            return  # table does not exist yet
        referenced_id_type = row[0].lower()  # 'uuid' or 'bigint'

        for table_name, column_name in tables_to_fix:

            # ── Check if the column exists in the referencing table ────────
            cursor.execute(f"""
                SELECT data_type
                FROM information_schema.columns
                WHERE table_name = '{table_name}'
                  AND column_name = '{column_name}'
            """)
            res = cursor.fetchone()
            if not res:
                continue
            col_type = res[0].lower()

            # ── Find existing FK constraints for this column ──────────────
            cursor.execute(f"""
                SELECT tc.constraint_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_name = kcu.constraint_name
                WHERE tc.table_name = '{table_name}'
                  AND kcu.column_name = '{column_name}'
                  AND tc.constraint_type = 'FOREIGN KEY'
            """)
            existing_fks = cursor.fetchall()
            had_fk = len(existing_fks) > 0

            # Drop all existing FK constraints
            for (cname,) in existing_fks:
                cursor.execute(
                    f"ALTER TABLE {table_name} DROP CONSTRAINT {cname}"
                )

            # ── If types already match, just ensure FK is present ─────────
            if col_type == referenced_id_type:
                if not had_fk:
                    # FK was missing but types match — add it
                    cursor.execute(f"""
                        ALTER TABLE {table_name}
                        ADD CONSTRAINT {table_name}_{column_name}_fk
                        FOREIGN KEY ({column_name})
                        REFERENCES wholesale_wholesaleuser(id)
                        DEFERRABLE INITIALLY DEFERRED;
                    """)
                else:
                    # FK existed and was dropped above — re-add it
                    cursor.execute(f"""
                        ALTER TABLE {table_name}
                        ADD CONSTRAINT {table_name}_{column_name}_fk
                        FOREIGN KEY ({column_name})
                        REFERENCES wholesale_wholesaleuser(id)
                        DEFERRABLE INITIALLY DEFERRED;
                    """)
                continue

            if col_type == 'uuid' and referenced_id_type in ('bigint', 'integer'):
                # Scenario C: column is UUID, referenced is bigint
                # Convert column from UUID → bigint (NULL all existing values)
                cursor.execute(f"""
                    ALTER TABLE {table_name}
                    ALTER COLUMN {column_name} TYPE bigint USING NULL;
                """)

            elif col_type in ('bigint', 'integer') and referenced_id_type == 'uuid':
                # Scenario B (production): column is bigint, referenced is UUID
                # Must enable pgcrypto for uuid support just in case
                try:
                    cursor.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
                except Exception:
                    pass
                # Convert column from bigint → uuid (NULL all existing values)
                cursor.execute(f"""
                    ALTER TABLE {table_name}
                    ALTER COLUMN {column_name} TYPE uuid USING NULL;
                """)

            # Re-add FK constraint now that types match
            cursor.execute(f"""
                ALTER TABLE {table_name}
                ADD CONSTRAINT {table_name}_{column_name}_fk
                FOREIGN KEY ({column_name})
                REFERENCES wholesale_wholesaleuser(id)
                DEFERRABLE INITIALLY DEFERRED;
            """)


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0016_order_fulfillment_store'),
    ]

    operations = [
        migrations.RunPython(fix_wholesale_fk, migrations.RunPython.noop),
    ]
