"""Script pour initialiser les rôles dans la base de données."""
from app.database import SessionLocal, engine, Base
from app.models.role import Role
from app.models.user import User

# Créer les tables si elles n'existent pas
Base.metadata.create_all(bind=engine)

db = SessionLocal()

ROLES = ["ADMIN", "ORGANIZER", "CLIENT"]

for role_name in ROLES:
    existing = db.query(Role).filter(Role.name == role_name).first()
    if not existing:
        db.add(Role(name=role_name))
        print(f"Rôle '{role_name}' créé.")
    else:
        print(f"Rôle '{role_name}' existe déjà.")

db.commit()
db.close()
print("Initialisation des rôles terminée.")
