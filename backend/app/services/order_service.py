from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.event import Event
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.ticket_type import TicketType
from app.schemas.order import CartItemAdd, CartItemUpdate


def _is_event_orderable(event: Event) -> bool:
    return event.status == "Publié"


def _cart_query(db: Session, user_id: int):
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user_id, Order.status == "CART")
    )


def _recompute_cart_total(cart: Order):
    cart.total_amount = sum((item.subtotal or 0) for item in cart.items)


def _get_or_create_cart(db: Session, user_id: int):
    cart = _cart_query(db, user_id).order_by(Order.created_at.desc()).first()
    if cart:
        return cart

    cart = Order(user_id=user_id, status="CART", total_amount=0)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


def get_cart(db: Session, user_id: int):
    return _get_or_create_cart(db, user_id)


def add_item_to_cart(db: Session, user_id: int, data: CartItemAdd):
    if data.quantity <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantité invalide")

    ticket = (
        db.query(TicketType)
        .options(joinedload(TicketType.event))
        .filter(TicketType.id == data.ticket_type_id)
        .first()
    )
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Type de ticket non trouvé")

    if not ticket.event or not _is_event_orderable(ticket.event):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible d'ajouter un ticket d'un événement non publié",
        )

    cart = _get_or_create_cart(db, user_id)

    existing = None
    for item in cart.items:
        if item.ticket_type_id == ticket.id:
            existing = item
            break

    if existing:
        existing.quantity += data.quantity
        existing.unit_price = ticket.price
        existing.ticket_name = ticket.name
        existing.event_id = ticket.event_id
        existing.event_title = ticket.event.title
        existing.subtotal = existing.quantity * existing.unit_price
    else:
        db.add(
            OrderItem(
                order_id=cart.id,
                ticket_type_id=ticket.id,
                event_id=ticket.event_id,
                event_title=ticket.event.title,
                ticket_name=ticket.name,
                unit_price=ticket.price,
                quantity=data.quantity,
                subtotal=ticket.price * data.quantity,
            )
        )

    db.flush()
    db.refresh(cart)
    _recompute_cart_total(cart)
    db.commit()
    db.refresh(cart)
    return cart


def update_cart_item(db: Session, user_id: int, item_id: int, data: CartItemUpdate):
    cart = _cart_query(db, user_id).with_for_update().order_by(Order.created_at.desc()).first()
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Panier introuvable")

    item = next((i for i in cart.items if i.id == item_id), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ligne panier introuvable")

    ticket = db.query(TicketType).filter(TicketType.id == item.ticket_type_id).first()
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Type de ticket non trouvé")

    item.quantity = data.quantity
    item.unit_price = ticket.price
    item.ticket_name = ticket.name
    item.subtotal = item.quantity * item.unit_price

    _recompute_cart_total(cart)
    db.commit()
    db.refresh(cart)
    return cart


def remove_cart_item(db: Session, user_id: int, item_id: int):
    cart = _cart_query(db, user_id).with_for_update().order_by(Order.created_at.desc()).first()
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Panier introuvable")

    item = next((i for i in cart.items if i.id == item_id), None)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ligne panier introuvable")

    db.delete(item)
    db.flush()
    db.refresh(cart)
    _recompute_cart_total(cart)
    db.commit()
    return {"message": "Ligne supprimée du panier"}


def checkout_cart(db: Session, user_id: int):
    cart = _cart_query(db, user_id).with_for_update().order_by(Order.created_at.desc()).first()
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Panier introuvable")

    if not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le panier est vide",
        )

    requested_quantities = {}
    for item in cart.items:
        requested_quantities[item.ticket_type_id] = requested_quantities.get(item.ticket_type_id, 0) + item.quantity

    ticket_ids = list(requested_quantities.keys())

    try:
        locked_ticket_types = (
            db.query(TicketType)
            .options(joinedload(TicketType.event))
            .filter(TicketType.id.in_(ticket_ids))
            .with_for_update()
            .all()
        )

        ticket_map = {t.id: t for t in locked_ticket_types}
        if len(ticket_map) != len(ticket_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un ou plusieurs types de tickets n'existent plus",
            )

        event_qty_map = {}
        event_ids = set()
        for ticket_id, qty in requested_quantities.items():
            ticket = ticket_map[ticket_id]
            if not ticket.event:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Le ticket est lié à un événement introuvable",
                )
            if not _is_event_orderable(ticket.event):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"L'événement '{ticket.event.title}' n'est pas commandable",
                )

            event_ids.add(ticket.event_id)
            event_qty_map[ticket.event_id] = event_qty_map.get(ticket.event_id, 0) + qty

        locked_events = (
            db.query(Event)
            .filter(Event.id.in_(list(event_ids)))
            .with_for_update()
            .all()
        )
        event_map = {e.id: e for e in locked_events}

        for event_id, qty in event_qty_map.items():
            event = event_map[event_id]
            if event.capacity is not None and event.capacity > 0:
                projected = (event.attendees or 0) + qty
                if projected > event.capacity:
                    remaining = max(event.capacity - (event.attendees or 0), 0)
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Capacité insuffisante pour '{event.title}'. Places restantes: {remaining}",
                    )

        total = 0.0
        for item in cart.items:
            ticket = ticket_map[item.ticket_type_id]
            available = ticket.quantity - ticket.sold
            if item.quantity > available:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Stock insuffisant pour '{ticket.name}'. Disponible: {available}",
                )

            item.ticket_name = ticket.name
            item.unit_price = ticket.price
            item.event_id = ticket.event_id
            item.event_title = ticket.event.title
            item.subtotal = item.quantity * item.unit_price
            total += item.subtotal

            ticket.sold += item.quantity

        for event_id, qty in event_qty_map.items():
            event = event_map[event_id]
            event.attendees = (event.attendees or 0) + qty

        cart.total_amount = total
        cart.status = "CONFIRMED"

        db.commit()

    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise

    created_order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == cart.id)
        .first()
    )
    return created_order


def get_orders_for_user(db: Session, user_id: int):
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.user_id == user_id, Order.status != "CART")
        .order_by(Order.created_at.desc())
        .all()
    )


def get_order_by_id_for_user(db: Session, order_id: int, user_id: int, is_admin: bool = False):
    query = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id)
    if not is_admin:
        query = query.filter(Order.user_id == user_id)

    order = query.first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commande non trouvée")
    return order
