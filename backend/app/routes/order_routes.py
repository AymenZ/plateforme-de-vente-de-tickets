from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import role_required
from app.database import get_db
from app.models.user import User
from app.schemas.order import CartItemAdd, CartItemUpdate, OrderOut
from app.services import order_service

router = APIRouter(prefix="/orders", tags=["Commandes"])


@router.get("/cart", response_model=OrderOut)
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Récupérer (ou créer) le panier actif du client connecté."""
    return order_service.get_cart(db=db, user_id=current_user.id)


@router.post("/cart/items", response_model=OrderOut)
def add_cart_item(
    payload: CartItemAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Ajouter un type de ticket au panier (multi-événements)."""
    return order_service.add_item_to_cart(db=db, user_id=current_user.id, data=payload)


@router.put("/cart/items/{item_id}", response_model=OrderOut)
def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Modifier la quantité d'une ligne du panier."""
    return order_service.update_cart_item(db=db, user_id=current_user.id, item_id=item_id, data=payload)


@router.delete("/cart/items/{item_id}")
def delete_cart_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Supprimer une ligne du panier."""
    return order_service.remove_cart_item(db=db, user_id=current_user.id, item_id=item_id)


@router.post("/cart/checkout", response_model=OrderOut)
def checkout_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Valider le panier en commande (stock + capacité vérifiés)."""
    return order_service.checkout_cart(db=db, user_id=current_user.id)


@router.get("/my", response_model=List[OrderOut])
def my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Lister les commandes du client connecté."""
    return order_service.get_orders_for_user(db, current_user.id)


@router.get("/{order_id}", response_model=OrderOut)
def order_detail(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Afficher le détail d'une commande (owner ou admin)."""
    is_admin = current_user.role and current_user.role.name == "ADMIN"
    return order_service.get_order_by_id_for_user(
        db=db,
        order_id=order_id,
        user_id=current_user.id,
        is_admin=is_admin,
    )
