"""One-time script: add status column to events table."""
from app.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE events ADD COLUMN status VARCHAR(20) DEFAULT 'Publié'"))
        conn.commit()
        print("✅ Column 'status' added to events table.")
    except Exception as e:
        if "Duplicate column" in str(e):
            print("ℹ️  Column 'status' already exists, skipping.")
        else:
            raise e
