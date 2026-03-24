"""Script pour ajouter des utilisateurs de test dans la base de données."""
from app.database import SessionLocal, engine, Base
from app.models.role import Role
from app.models.user import User
from app.core.security import hash_password

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Utilisateurs de test — mot de passe identique pour tous : "test123"
TEST_USERS = [
    {"email": "admin@eventhub.tn",    "password": "test123", "role": "ADMIN"},
    {"email": "org@eventhub.tn",      "password": "test123", "role": "ORGANIZER"},
    {"email": "client@eventhub.tn",   "password": "test123", "role": "CLIENT"},
    {"email": "client2@eventhub.tn",  "password": "test123", "role": "CLIENT"},
]

for u in TEST_USERS:
    existing = db.query(User).filter(User.email == u["email"]).first()
    if existing:
        print(f"  ✓ '{u['email']}' existe déjà (id={existing.id}), ignoré.")
        continue

    role = db.query(Role).filter(Role.name == u["role"]).first()
    if not role:
        print(f"  ✗ Rôle '{u['role']}' introuvable. Lancez d'abord : python seed_roles.py")
        continue

    user = User(
        email=u["email"],
        password_hash=hash_password(u["password"]),
        role_id=role.id,
    )
    db.add(user)
    print(f"  + Utilisateur '{u['email']}' créé (rôle: {u['role']})")

db.commit()
db.close()
print("\n✅ Seed utilisateurs terminé.")
