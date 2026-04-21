from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, role_required
from app.database import get_db
from app.models.user import User
from app.schemas.ticket import TicketOut, TicketVerifyOut
from app.services import ticket_service

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.get("/my", response_model=List[TicketOut])
def my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Lister tous les tickets achetés par l'utilisateur connecté."""
    return ticket_service.get_my_tickets(db=db, user_id=current_user.id)


@router.get("/order/{order_id}", response_model=List[TicketOut])
def order_tickets(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required("CLIENT", "ADMIN")),
):
    """Lister les tickets d'une commande (owner ou admin)."""
    return ticket_service.get_tickets_for_order(db=db, order_id=order_id, current_user=current_user)


@router.get("/verify/{ticket_code}", response_model=TicketVerifyOut)
def verify_ticket(
    ticket_code: str,
    db: Session = Depends(get_db),
):
    """Vérifier un ticket via son code (utilisé par QR scan)."""
    return ticket_service.verify_ticket_code(db=db, ticket_code=ticket_code)


@router.get("/{ticket_id}", response_model=TicketOut)
def ticket_detail(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Afficher le détail d'un ticket (owner ou admin)."""
    return ticket_service.get_ticket_for_user(db=db, ticket_id=ticket_id, current_user=current_user)
