"""
Combined seed script — roles + test users.
Run inside the backend container:
  docker compose exec backend python seed_all.py
"""
import time
import sys
from sqlalchemy import text
from app.database import SessionLocal, engine, Base
from app.models.role import Role
from app.models.user import User
from app.models.event import Event
from app.core.security import hash_password

# Wait for DB to be ready (useful inside Docker)
MAX_RETRIES = 15
for i in range(MAX_RETRIES):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        break
    except Exception:
        print(f"⏳ Waiting for database... ({i+1}/{MAX_RETRIES})")
        time.sleep(2)
else:
    print("❌ Could not connect to database after retries.")
    sys.exit(1)

# Create tables
Base.metadata.create_all(bind=engine)
print("✅ Tables created / verified.")

db = SessionLocal()

# ── 1. Roles ──
ROLES = ["ADMIN", "ORGANIZER", "CLIENT"]
for role_name in ROLES:
    if not db.query(Role).filter(Role.name == role_name).first():
        db.add(Role(name=role_name))
        print(f"  + Rôle '{role_name}' créé.")
    else:
        print(f"  ✓ Rôle '{role_name}' existe déjà.")
db.commit()

# ── 2. Test users ──
TEST_USERS = [
    {"email": "admin@eventhub.tn",   "password": "test123", "role": "ADMIN"},
    {"email": "org@eventhub.tn",     "password": "test123", "role": "ORGANIZER"},
    {"email": "client@eventhub.tn",  "password": "test123", "role": "CLIENT"},
    {"email": "client2@eventhub.tn", "password": "test123", "role": "CLIENT"},
]
for u in TEST_USERS:
    if db.query(User).filter(User.email == u["email"]).first():
        print(f"  ✓ '{u['email']}' existe déjà.")
        continue
    role = db.query(Role).filter(Role.name == u["role"]).first()
    if not role:
        print(f"  ✗ Rôle '{u['role']}' introuvable!")
        continue
    db.add(User(email=u["email"], password_hash=hash_password(u["password"]), role_id=role.id))
    print(f"  + Utilisateur '{u['email']}' créé (rôle: {u['role']})")
db.commit()

db.close()
print("\n🎉 Seed terminé avec succès.")
