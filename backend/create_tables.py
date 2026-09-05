import os
import django
from django.db import connection

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.apps import apps
from django.db.backends.base.schema import BaseDatabaseSchemaEditor

def create_missing_tables():
    wholesale_app = apps.get_app_config('wholesale')
    models = wholesale_app.get_models()
    
    with connection.schema_editor() as editor:
        for model in models:
            # We already dropped them, so we can safely create them
            try:
                editor.create_model(model)
                print(f"Created table for {model.__name__}")
            except Exception as e:
                print(f"Failed to create table for {model.__name__}: {e}")

if __name__ == '__main__':
    create_missing_tables()
