from app.core.security import verify_password, create_access_token
from app.services.user_service import get_user_by_email


def authenticate_user(db, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def login_user(user):
    token_data = {
        "user_id": user.id,
        "role": user.role.name
    }
    return create_access_token(token_data)
