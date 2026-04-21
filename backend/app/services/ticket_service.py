from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import BACKEND_BASE_URL
from app.models.order import Order
from app.models.ticket import Ticket
from app.models.user import User


def _generate_ticket_code() -> str:
    return f"TKT-{uuid4().hex[:20].upper()}"


def _build_qr_value(ticket_code: str) -> str:
    return f"{BACKEND_BASE_URL.rstrip('/')}/tickets/verify/{ticket_code}"


def _is_admin(user: User) -> bool:
    return bool(user.role and user.role.name == "ADMIN")


def ensure_tickets_generated_for_paid_order(db: Session, order: Order) -> bool:
    """
    Reconcile tickets for a paid order so each order item has exactly `quantity` tickets.
    - Missing tickets are generated.
    - Extra tickets (from older race conditions) are removed.

    Returns True if data changed, else False.
    """
    if not order.items:
        return False

    now = datetime.utcnow()
    changed = False

    for item in order.items:
        expected_quantity = max(int(item.quantity or 0), 0)
        existing_tickets = (
            db.query(Ticket)
            .filter(Ticket.order_id == order.id, Ticket.order_item_id == item.id)
            .order_by(Ticket.id.asc())
            .all()
        )

        if len(existing_tickets) > expected_quantity:
            extras = existing_tickets[expected_quantity:]
            for extra_ticket in extras:
                db.delete(extra_ticket)
            existing_tickets = existing_tickets[:expected_quantity]
            changed = True

        missing = expected_quantity - len(existing_tickets)
        for _ in range(missing):
            ticket_code = _generate_ticket_code()
            db.add(
                Ticket(
                    ticket_code=ticket_code,
                    qr_value=_build_qr_value(ticket_code),
                    status="VALID",
                    order_id=order.id,
                    order_item_id=item.id,
                    user_id=order.user_id,
                    event_id=item.event_id,
                    ticket_type_id=item.ticket_type_id,
                    event_title=item.event_title,
                    ticket_name=item.ticket_name,
                    unit_price=item.unit_price,
                    purchased_at=order.paid_at or now,
                    used_at=None,
                )
            )
            changed = True

    return changed


def get_my_tickets(db: Session, user_id: int) -> list[Ticket]:
    paid_orders = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user_id, Order.payment_status == "PAID")
        .all()
    )

    changed = False
    for order in paid_orders:
        changed = ensure_tickets_generated_for_paid_order(db, order) or changed

    if changed:
        db.commit()

    return (
        db.query(Ticket)
        .filter(Ticket.user_id == user_id)
        .order_by(Ticket.purchased_at.desc(), Ticket.id.desc())
        .all()
    )


def get_ticket_for_user(db: Session, ticket_id: int, current_user: User) -> Ticket:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")

    if ticket.user_id != current_user.id and not _is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    return ticket


def get_tickets_for_order(db: Session, order_id: int, current_user: User) -> list[Ticket]:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commande introuvable")

    if order.user_id != current_user.id and not _is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if ensure_tickets_generated_for_paid_order(db, order):
        db.commit()

    return (
        db.query(Ticket)
        .filter(Ticket.order_id == order_id)
        .order_by(Ticket.purchased_at.desc(), Ticket.id.desc())
        .all()
    )


def verify_ticket_code(db: Session, ticket_code: str) -> dict:
    ticket = db.query(Ticket).filter(Ticket.ticket_code == ticket_code).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket introuvable")

    return {
        "ticket_code": ticket.ticket_code,
        "status": ticket.status,
        "is_valid": ticket.status == "VALID",
        "event_title": ticket.event_title,
        "ticket_name": ticket.ticket_name,
        "order_id": ticket.order_id,
        "purchased_at": ticket.purchased_at,
        "used_at": ticket.used_at,
    }
