from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.core.security import hash_password

def create_user(db: Session, email: str, password: str):
    role = db.query(Role).filter(Role.name == "CLIENT").first()

    user = User(
        email=email,
        password_hash=hash_password(password),
        role_id=role.id
    )

    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()
