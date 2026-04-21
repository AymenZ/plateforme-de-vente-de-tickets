from __future__ import annotations

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

import stripe
from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.config import FRONTEND_BASE_URL, STRIPE_CURRENCY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
from app.models.event import Event
from app.models.order import Order
from app.models.ticket_type import TicketType
from app.models.user import User
from app.services import ticket_service

ZERO_DECIMAL_CURRENCIES = {
    "bif",
    "clp",
    "djf",
    "gnf",
    "jpy",
    "kmf",
    "krw",
    "mga",
    "pyg",
    "rwf",
    "ugx",
    "vnd",
    "vuv",
    "xaf",
    "xof",
    "xpf",
}


def _ensure_stripe_ready() -> None:
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Configuration Stripe manquante (STRIPE_SECRET_KEY)",
        )
    stripe.api_key = STRIPE_SECRET_KEY


def _is_event_orderable(event: Event) -> bool:
    return event.status == "Publié"


def _minor_units_from_amount(amount: float, currency: str) -> int:
    normalized_currency = (currency or "usd").lower()
    decimal_amount = Decimal(str(amount or 0))

    if normalized_currency in ZERO_DECIMAL_CURRENCIES:
        return int(decimal_amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    return int((decimal_amount * Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _append_query_params_raw(url: str, params: dict[str, str]) -> str:
    raw_pairs = [f"{key}={value}" for key, value in params.items() if value is not None]
    if not raw_pairs:
        return url

    if url.endswith("?") or url.endswith("&"):
        separator = ""
    else:
        separator = "&" if "?" in url else "?"

    return f"{url}{separator}{'&'.join(raw_pairs)}"


def _frontend_base_url() -> str:
    return (FRONTEND_BASE_URL or "http://localhost:5173").rstrip("/")


def _get_locked_cart(db: Session, user_id: int) -> Order | None:
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user_id, Order.status == "CART")
        .with_for_update()
        .order_by(Order.created_at.desc())
        .first()
    )


def _refresh_cart_items_and_total(db: Session, cart: Order) -> float:
    total = 0.0

    for item in cart.items:
        ticket = (
            db.query(TicketType)
            .options(joinedload(TicketType.event))
            .filter(TicketType.id == item.ticket_type_id)
            .first()
        )

        if not ticket or not ticket.event:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un type de ticket du panier n'est plus disponible",
            )

        if not _is_event_orderable(ticket.event):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"L'événement '{ticket.event.title}' n'est plus commandable",
            )

        available = max((ticket.quantity or 0) - (ticket.sold or 0), 0)
        if item.quantity > available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuffisant pour '{ticket.name}'. Disponible: {available}",
            )

        item.unit_price = float(ticket.price or 0)
        item.ticket_name = ticket.name
        item.event_id = ticket.event_id
        item.event_title = ticket.event.title
        item.subtotal = item.unit_price * item.quantity
        total += item.subtotal

    cart.total_amount = total
    return total


def _build_stripe_line_items(order: Order, currency: str) -> list[dict[str, Any]]:
    line_items: list[dict[str, Any]] = []

    for item in order.items:
        line_items.append(
            {
                "price_data": {
                    "currency": currency,
                    "product_data": {
                        "name": f"{item.event_title} - {item.ticket_name}",
                    },
                    "unit_amount": _minor_units_from_amount(item.unit_price, currency),
                },
                "quantity": int(item.quantity),
            }
        )

    return line_items


def _get_locked_order_for_payment(db: Session, order_id: int) -> Order:
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id)
        .with_for_update()
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commande non trouvée")
    return order


def _apply_stock_and_capacity_for_order(db: Session, order: Order) -> None:
    requested_quantities: dict[int, int] = {}
    for item in order.items:
        requested_quantities[item.ticket_type_id] = requested_quantities.get(item.ticket_type_id, 0) + item.quantity

    ticket_ids = list(requested_quantities.keys())
    locked_ticket_types = (
        db.query(TicketType)
        .options(joinedload(TicketType.event))
        .filter(TicketType.id.in_(ticket_ids))
        .with_for_update()
        .all()
    )

    ticket_map = {ticket.id: ticket for ticket in locked_ticket_types}
    if len(ticket_map) != len(ticket_ids):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un ou plusieurs tickets de la commande n'existent plus",
        )

    event_qty_map: dict[int, int] = {}
    event_ids: set[int] = set()

    for ticket_id, quantity in requested_quantities.items():
        ticket = ticket_map[ticket_id]
        if not ticket.event:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Événement associé à un ticket introuvable",
            )

        event_ids.add(ticket.event_id)
        event_qty_map[ticket.event_id] = event_qty_map.get(ticket.event_id, 0) + quantity

    locked_events = (
        db.query(Event)
        .filter(Event.id.in_(list(event_ids)))
        .with_for_update()
        .all()
    )
    event_map = {event.id: event for event in locked_events}

    for event_id, quantity in event_qty_map.items():
        event = event_map.get(event_id)
        if not event:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Événement introuvable pendant la confirmation du paiement",
            )

        if event.capacity is not None and event.capacity > 0:
            projected = (event.attendees or 0) + quantity
            if projected > event.capacity:
                remaining = max((event.capacity or 0) - (event.attendees or 0), 0)
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Capacité insuffisante pour '{event.title}'. Places restantes: {remaining}",
                )

    for item in order.items:
        ticket = ticket_map[item.ticket_type_id]
        available = max((ticket.quantity or 0) - (ticket.sold or 0), 0)
        if item.quantity > available:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Stock insuffisant pour '{ticket.name}'. Disponible: {available}",
            )

        ticket.sold = (ticket.sold or 0) + item.quantity

    for event_id, quantity in event_qty_map.items():
        event = event_map[event_id]
        event.attendees = (event.attendees or 0) + quantity


def _finalize_order_as_paid(
    db: Session,
    order_id: int,
    payment_intent_id: str | None,
    payment_provider: str = "STRIPE",
) -> Order:
    order = _get_locked_order_for_payment(db, order_id)

    if order.status == "PAID" and order.payment_status == "PAID":
        ticket_service.ensure_tickets_generated_for_paid_order(db, order)
        db.commit()
        db.refresh(order)
        return order

    if not order.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Commande vide: impossible de confirmer le paiement",
        )

    _apply_stock_and_capacity_for_order(db, order)

    order.status = "PAID"
    order.payment_status = "PAID"
    order.payment_provider = payment_provider
    order.paid_at = datetime.utcnow()
    if payment_intent_id:
        order.stripe_payment_intent_id = payment_intent_id

    ticket_service.ensure_tickets_generated_for_paid_order(db, order)

    db.commit()
    db.refresh(order)
    return order


def create_checkout_session_from_cart(
    db: Session,
    current_user: User,
    success_url: str | None = None,
    cancel_url: str | None = None,
) -> dict[str, Any]:
    cart = _get_locked_cart(db, current_user.id)
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Panier introuvable")

    if not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Le panier est vide")

    total = _refresh_cart_items_and_total(db, cart)

    if total <= 0:
        order = _finalize_order_as_paid(
            db=db,
            order_id=cart.id,
            payment_intent_id="FREE_ORDER",
            payment_provider="FREE",
        )
        return {
            "order_id": order.id,
            "status": order.status,
            "payment_status": order.payment_status,
            "checkout_url": None,
            "session_id": None,
        }

    _ensure_stripe_ready()

    normalized_currency = (STRIPE_CURRENCY or "usd").lower()
    line_items = _build_stripe_line_items(cart, normalized_currency)

    final_success_url = _append_query_params_raw(
        success_url or f"{_frontend_base_url()}/payment/success",
        {
            "order_id": str(cart.id),
            "session_id": "{CHECKOUT_SESSION_ID}",
        },
    )
    final_cancel_url = _append_query_params_raw(
        cancel_url or f"{_frontend_base_url()}/payment/cancel",
        {"order_id": str(cart.id)},
    )

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=line_items,
            success_url=final_success_url,
            cancel_url=final_cancel_url,
            customer_email=current_user.email,
            client_reference_id=str(cart.id),
            metadata={
                "order_id": str(cart.id),
                "user_id": str(current_user.id),
            },
        )

        # Keep cart status until payment is actually confirmed.
        cart.status = "CART"
        cart.payment_status = "PENDING"
        cart.payment_provider = "STRIPE"
        cart.payment_currency = normalized_currency
        cart.stripe_session_id = session.id
        if session.payment_intent:
            cart.stripe_payment_intent_id = str(session.payment_intent)

        db.commit()
        db.refresh(cart)

        return {
            "order_id": cart.id,
            "status": cart.status,
            "payment_status": cart.payment_status,
            "checkout_url": session.url,
            "session_id": session.id,
        }
    except stripe.error.StripeError as exc:
        db.rollback()
        message = getattr(exc, "user_message", None) or str(exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Stripe indisponible: {message}",
        )


def _mark_order_canceled_or_failed(db: Session, session_id: str, failed: bool = False) -> None:
    order = (
        db.query(Order)
        .filter(Order.stripe_session_id == session_id)
        .with_for_update()
        .first()
    )
    if not order or order.status == "PAID":
        return

    # Keep it as cart so user can retry payment without rebuilding the cart.
    order.status = "CART"
    order.payment_status = "FAILED" if failed else "CANCELED"
    db.commit()


def sync_checkout_session(db: Session, session_id: str, current_user: User) -> dict[str, Any]:
    _ensure_stripe_ready()

    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.StripeError as exc:
        message = getattr(exc, "user_message", None) or str(exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Impossible de récupérer la session Stripe: {message}",
        )

    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.stripe_session_id == session.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commande Stripe introuvable")

    is_admin = bool(current_user.role and current_user.role.name == "ADMIN")
    if order.user_id != current_user.id and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    payment_status = (session.payment_status or "").lower()
    payment_intent = str(session.payment_intent) if session.payment_intent else None

    if payment_status in {"paid", "no_payment_required"}:
        order = _finalize_order_as_paid(
            db=db,
            order_id=order.id,
            payment_intent_id=payment_intent,
        )
    else:
        if session.status == "expired":
            _mark_order_canceled_or_failed(db, session.id, failed=False)
            db.refresh(order)

    return {
        "order_id": order.id,
        "status": order.status,
        "payment_status": order.payment_status,
        "checkout_url": None,
        "session_id": session.id,
    }


def process_webhook_event(db: Session, payload: bytes, signature_header: str | None) -> dict[str, Any]:
    _ensure_stripe_ready()

    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Configuration Stripe webhook manquante (STRIPE_WEBHOOK_SECRET)",
        )

    try:
        event = stripe.Webhook.construct_event(payload, signature_header, STRIPE_WEBHOOK_SECRET)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payload webhook invalide")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Signature Stripe invalide")

    event_type = event.get("type")
    data_object = (event.get("data") or {}).get("object") or {}
    session_id = data_object.get("id")

    if not session_id:
        return {"received": True}

    if event_type == "checkout.session.completed":
        order = db.query(Order).filter(Order.stripe_session_id == session_id).first()
        if order:
            payment_intent = data_object.get("payment_intent")
            _finalize_order_as_paid(
                db=db,
                order_id=order.id,
                payment_intent_id=str(payment_intent) if payment_intent else None,
            )

    elif event_type == "checkout.session.expired":
        _mark_order_canceled_or_failed(db, session_id, failed=False)

    elif event_type in {"checkout.session.async_payment_failed", "payment_intent.payment_failed"}:
        _mark_order_canceled_or_failed(db, session_id, failed=True)

    return {"received": True}
