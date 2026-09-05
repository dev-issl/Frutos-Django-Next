import sqlite3
from datetime import datetime

def restore():
    conn = sqlite3.connect('db.sqlite3')
    c = conn.cursor()
    
    migrations = [
        '0001_initial',
        '0002_wholesalebenefit_wholesalecategory_and_more',
        '0003_remove_wholesaleuser_serial_number',
        '0004_wholesalepagecontent_delete_wholesalebenefit_and_more',
        '0005_alter_wholesalepagecontent_benefits_and_more',
        '0006_alter_wholesaleuser_user_permissions',
        '0007_wholesaledailyreport',
        '0008_wholesalenotification_metadata',
        '0009_force_remove_serial_number',
        '0010_wholesaleuser_serial_number',
        '0011_fix_id_sequence',
        '0012_remove_wholesaleuser_serial_number',
        '0013_fix_wholesaleuser_id_sequence_final',
        '0014_wholesaleuser_user_type',
        '0015_alter_wholesaleuser_id'
    ]
    
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    for m in migrations:
        try:
            c.execute("INSERT INTO django_migrations (app, name, applied) VALUES (?, ?, ?)", ('wholesale', m, now))
        except Exception as e:
            pass
            
    conn.commit()
    print("Restored wholesale migrations")
    conn.close()

if __name__ == '__main__':
    restore()
