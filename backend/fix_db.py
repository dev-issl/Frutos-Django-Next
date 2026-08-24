import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connection

tables_to_fix = [
    ('orders_order', 'wholesale_user_id'),
    ('accounts_supportticket', 'wholesale_user_id'),
    ('accounts_supportticketmessage', 'wholesale_sender_id'),
]

with connection.cursor() as cursor:
    for table_name, column_name in tables_to_fix:
        try:
            print(f"Fixing {table_name}.{column_name}")
            
            # Check if column exists
            cursor.execute(f"SELECT data_type FROM information_schema.columns WHERE table_name = '{table_name}' AND column_name = '{column_name}'")
            res = cursor.fetchone()
            if not res:
                print(f"Column {column_name} not found in {table_name}")
                continue
            col_type = res[0].lower()
            if col_type == 'uuid':
                print(f"Converting {table_name}.{column_name} from uuid to bigint")
                # Need to drop FK first
                cursor.execute(f"SELECT tc.constraint_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name WHERE tc.table_name = '{table_name}' AND kcu.column_name = '{column_name}' AND tc.constraint_type = 'FOREIGN KEY'")
                fks = cursor.fetchall()
                for (cname,) in fks:
                    cursor.execute(f"ALTER TABLE {table_name} DROP CONSTRAINT {cname}")
                    
                cursor.execute(f"ALTER TABLE {table_name} ALTER COLUMN {column_name} TYPE bigint USING NULL")
                
                # Re-add FK
                cursor.execute(f"ALTER TABLE {table_name} ADD CONSTRAINT {table_name}_{column_name}_fk FOREIGN KEY ({column_name}) REFERENCES wholesale_wholesaleuser(id) DEFERRABLE INITIALLY DEFERRED")
                print(f"Successfully fixed {table_name}.{column_name}")
            else:
                print(f"Column {table_name}.{column_name} is already {col_type}, no fix needed")
        except Exception as e:
            print(f"Error fixing {table_name}.{column_name}: {e}")
