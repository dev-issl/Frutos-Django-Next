from django.db import migrations

def cast_uuid_to_bigint(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        tables_to_fix = [
            ('orders_order', 'wholesale_user_id'),
            ('accounts_supportticket', 'wholesale_user_id'),
            ('accounts_supportticketmessage', 'wholesale_sender_id'),
        ]
        
        with schema_editor.connection.cursor() as cursor:
            for table_name, column_name in tables_to_fix:
                cursor.execute(f"""
                    SELECT data_type 
                    FROM information_schema.columns 
                    WHERE table_name='{table_name}' 
                    AND column_name='{column_name}'
                """)
                result = cursor.fetchone()
                if result and result[0] == 'uuid':
                    cursor.execute(f"""
                        SELECT tc.constraint_name 
                        FROM information_schema.table_constraints tc 
                        JOIN information_schema.key_column_usage kcu 
                          ON tc.constraint_name = kcu.constraint_name 
                        WHERE tc.table_name = '{table_name}' 
                          AND kcu.column_name = '{column_name}' 
                          AND tc.constraint_type = 'FOREIGN KEY'
                    """)
                    constraints = cursor.fetchall()
                    for constraint in constraints:
                        cursor.execute(f"ALTER TABLE {table_name} DROP CONSTRAINT {constraint[0]}")
                    
                    cursor.execute(f"""
                        ALTER TABLE {table_name} 
                        ALTER COLUMN {column_name} TYPE bigint USING NULL;
                    """)
                    
                    # Recreate the foreign key constraint
                    cursor.execute(f"""
                        ALTER TABLE {table_name}
                        ADD CONSTRAINT {table_name}_{column_name}_fk 
                        FOREIGN KEY ({column_name}) REFERENCES wholesale_wholesaleuser(id) DEFERRABLE INITIALLY DEFERRED;
                    """)

class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0016_order_fulfillment_store'),
    ]

    operations = [
        migrations.RunPython(cast_uuid_to_bigint, migrations.RunPython.noop),
    ]
