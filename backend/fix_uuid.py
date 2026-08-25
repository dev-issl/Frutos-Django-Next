import sqlite3

def is_valid_uuid(val):
    import uuid
    try:
        uuid.UUID(str(val))
        return True
    except Exception:
        return False

def fix_db():
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, wholesale_user_id FROM orders_order WHERE wholesale_user_id IS NOT NULL")
    rows = cursor.fetchall()
    
    for row in rows:
        order_id, ws_id = row
        if not is_valid_uuid(ws_id):
            print(f"Fixing Order ID {order_id}: Invalid wholesale_user_id '{ws_id}' -> NULL")
            cursor.execute("UPDATE orders_order SET wholesale_user_id = NULL WHERE id = ?", (order_id,))
            
    conn.commit()
    conn.close()
    print("Done fixing orders_order.")

if __name__ == "__main__":
    fix_db()
