import sqlite3

def fix_db():
    conn = sqlite3.connect('db.sqlite3')
    c = conn.cursor()
    
    # Check if there are any important wholesale users
    users = c.execute("SELECT id, email FROM wholesale_wholesaleuser").fetchall()
    print("Found users:", users)
    
    # We will drop all wholesale tables and clear migrations
    tables = [
        "wholesale_wholesaledailyreport",
        "wholesale_wholesaledocument",
        "wholesale_wholesalenotification",
        "wholesale_wholesaleuser_groups",
        "wholesale_wholesaleuser_user_permissions",
        "wholesale_wholesaleuser",
        "wholesale_wholesalepagecontent",
    ]
    
    for t in tables:
        try:
            c.execute(f"DROP TABLE IF EXISTS {t}")
            print(f"Dropped {t}")
        except Exception as e:
            print(f"Failed to drop {t}: {e}")
            
    c.execute("DELETE FROM django_migrations WHERE app='wholesale'")
    conn.commit()
    print("Deleted wholesale migrations.")
    conn.close()

if __name__ == "__main__":
    fix_db()
