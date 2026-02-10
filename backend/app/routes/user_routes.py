from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.user_schema import UserResponse
from app.core.dependencies import get_current_user, role_required
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["Utilisateurs"])


class RoleUpdate(BaseModel):
    role_name: str


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Récupérer le profil de l'utilisateur connecté."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        role_id=current_user.role_id,
        role_name=current_user.role.name if current_user.role else None,
    )


@router.put("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_data: RoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(role_required("ADMIN")),
):
    """Modifier le rôle d'un utilisateur (admin uniquement)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé",
        )

    role = db.query(Role).filter(Role.name == role_data.role_name.upper()).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rôle '{role_data.role_name}' n'existe pas. Rôles valides : ADMIN, ORGANIZER, CLIENT",
        )

    user.role_id = role.id
    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        email=user.email,
        role_id=user.role_id,
        role_name=user.role.name if user.role else None,
    )


@router.get("/", response_model=list[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(role_required("ADMIN")),
):
    """Lister tous les utilisateurs (admin uniquement)."""
    users = db.query(User).all()
    return [
        UserResponse(
            id=u.id,
            email=u.email,
            role_id=u.role_id,
            role_name=u.role.name if u.role else None,
        )
        for u in users
    ]
