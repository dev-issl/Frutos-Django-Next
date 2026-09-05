import sqlite3
def fix():
    conn = sqlite3.connect('db.sqlite3')
    conn.execute("UPDATE wholesale_wholesaleuser SET user_type='RESTAURANT' WHERE email='munnahowlader06@gmail.com'")
    conn.commit()
    conn.close()

if __name__ == '__main__':
    fix()
