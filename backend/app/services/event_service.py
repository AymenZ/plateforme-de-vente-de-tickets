from sqlalchemy import func
from sqlalchemy.orm import Session
from datetime import date, datetime
from app.models.event import Event
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.ticket_type import TicketType
from app.schemas.event import EventCreate, EventUpdate


def _event_to_dict(event: Event) -> dict:
    """Convert an Event ORM object to a dict with the tickets property resolved."""
    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "category": event.category,
        "date": event.date,
        "time": event.time,
        "location": event.location,
        "image": event.image,
        "price": event.price,
        "capacity": event.capacity,
        "attendees": event.attendees,
        "duration": event.duration,
        "age_min": event.age_min,
        "extra_info": event.extra_info,
        "status": event.status,
        "tickets": [
            {
                "id": t.id,
                "name": t.name,
                "price": t.price,
                "quantity": t.quantity,
                "sold": t.sold,
                "event_id": t.event_id,
            }
            for t in event.ticket_types
        ],
        "organizer_id": event.organizer_id,
    }


def _event_to_admin_row(event: Event) -> dict:
    organizer_email = ""
    if event.organizer is not None:
        organizer_email = str(event.organizer.email or "")

    return {
        "id": event.id,
        "title": event.title,
        "organizer_id": event.organizer_id,
        "organizer_email": organizer_email,
        "date": event.date,
        "status": event.status,
    }


def _build_ticket_types(ticket_payload):
    if not ticket_payload:
        return []

    ticket_types = []
    for item in ticket_payload:
        if hasattr(item, "model_dump"):
            data = item.model_dump()
        elif isinstance(item, dict):
            data = item
        else:
            continue

        ticket_types.append(
            TicketType(
                name=str(data.get("name") or "Standard").strip() or "Standard",
                price=float(data.get("price") or 0),
                quantity=int(data.get("quantity") or 0),
            )
        )
    return ticket_types


def create_event(db: Session, data: EventCreate, organizer_id: int):
    payload = data.model_dump(exclude={"tickets"})
    event = Event(**payload, organizer_id=organizer_id)

    ticket_types = _build_ticket_types(data.tickets)

    # Safety net: always persist at least one ticket type row for a new event,
    # including draft saves where frontend payload may miss ticket fields.
    if not ticket_types:
        ticket_types = [
            TicketType(
                name="Standard",
                price=float(payload.get("price") or 0),
                quantity=int(payload.get("capacity") or 0),
            )
        ]

    for ticket_type in ticket_types:
        event.ticket_types.append(ticket_type)

    db.add(event)
    db.commit()
    db.refresh(event)
    return _event_to_dict(event)


def get_all_events(db: Session):
    events = db.query(Event).all()
    return [
        _event_to_dict(e)
        for e in events
        if _normalize_status(e.status) == "published"
    ]


def get_events_by_organizer(db: Session, organizer_id: int):
    """Return all events owned by a specific organizer."""
    events = db.query(Event).filter(Event.organizer_id == organizer_id).all()
    return [_event_to_dict(e) for e in events]


def get_all_events_for_admin(db: Session):
    """Return all events with organizer email for admin management."""
    events = db.query(Event).order_by(Event.date.desc()).all()
    return [_event_to_admin_row(event) for event in events]


def toggle_event_status_by_admin(db: Session, event_id: int):
    """Toggle event status between Publié and Dépublié (admin-only workflow)."""
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None

    normalized = _normalize_status(event.status)
    if normalized == "depublished":
        event.status = "Publié"
    else:
        event.status = "Dépublié"

    db.commit()
    db.refresh(event)
    return _event_to_admin_row(event)


def _normalize_status(status: str | None) -> str:
    normalized = str(status or "").strip().lower()
    if normalized in {"publié", "publie", "published"}:
        return "published"
    if normalized in {"dépublié", "depublie", "depublished", "unpublished"}:
        return "depublished"
    if normalized in {"brouillon", "draft"}:
        return "draft"
    if normalized in {"terminé", "termine", "finished"}:
        return "finished"
    return normalized


def _is_admin_role(role_name: str | None) -> bool:
    return str(role_name or "").strip().upper() == "ADMIN"


def _is_past_event_date(event_date: str | None) -> bool:
    if not event_date:
        return False

    date_text = str(event_date).strip()
    if len(date_text) >= 10:
        date_text = date_text[:10]

    try:
        parsed_date = datetime.strptime(date_text, "%Y-%m-%d").date()
    except ValueError:
        return False

    return parsed_date < date.today()


def get_organizer_dashboard_stats(db: Session, organizer_id: int) -> dict:
    events = (
        db.query(Event)
        .filter(Event.organizer_id == organizer_id)
        .order_by(Event.date.desc())
        .all()
    )

    if not events:
        return {
            "summary": {
                "total_events": 0,
                "published_events": 0,
                "draft_events": 0,
                "finished_events": 0,
                "total_revenue": 0.0,
                "total_tickets_sold": 0,
                "total_comments": 0,
                "average_rating": None,
                "currency": "USD",
            },
            "by_event": [],
        }

    event_ids = [event.id for event in events]

    paid_stats_rows = (
        db.query(
            OrderItem.event_id.label("event_id"),
            func.coalesce(func.sum(OrderItem.subtotal), 0.0).label("revenue"),
            func.coalesce(func.sum(OrderItem.quantity), 0).label("tickets_sold"),
            func.count(func.distinct(OrderItem.order_id)).label("paid_orders"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .filter(
            OrderItem.event_id.in_(event_ids),
            Order.payment_status == "PAID",
        )
        .group_by(OrderItem.event_id)
        .all()
    )

    paid_stats_by_event: dict[int, dict] = {}
    for row in paid_stats_rows:
        paid_stats_by_event[int(row.event_id)] = {
            "revenue": float(row.revenue or 0.0),
            "tickets_sold": int(row.tickets_sold or 0),
            "paid_orders": int(row.paid_orders or 0),
        }

    comment_stats_by_event: dict[int, dict] = {}
    try:
        from app.services import comment_service

        comment_stats_by_event = comment_service.get_comment_stats_for_events(event_ids)
    except Exception:
        # Keep dashboard operational even if Mongo comment service is temporarily unavailable.
        comment_stats_by_event = {}

    published_events = 0
    draft_events = 0
    finished_events = 0

    for event in events:
        normalized_status = _normalize_status(event.status)
        if normalized_status == "draft":
            draft_events += 1
            continue

        if normalized_status == "finished":
            finished_events += 1
            continue

        if normalized_status == "published":
            if _is_past_event_date(event.date):
                finished_events += 1
            else:
                published_events += 1

    total_revenue = 0.0
    total_tickets_sold = 0
    total_comments = 0
    total_rating_sum = 0.0

    by_event = []
    for event in events:
        order_stats = paid_stats_by_event.get(
            event.id,
            {
                "revenue": 0.0,
                "tickets_sold": 0,
                "paid_orders": 0,
            },
        )
        comments_stats = comment_stats_by_event.get(
            event.id,
            {
                "comments_count": 0,
                "average_rating": None,
                "rating_sum": 0.0,
            },
        )

        comments_count = int(comments_stats.get("comments_count") or 0)
        average_rating_value = comments_stats.get("average_rating")
        average_rating = round(float(average_rating_value), 2) if average_rating_value is not None else None
        rating_sum = float(comments_stats.get("rating_sum") or 0.0)

        revenue = float(order_stats["revenue"])
        tickets_sold = int(order_stats["tickets_sold"])

        total_revenue += revenue
        total_tickets_sold += tickets_sold
        total_comments += comments_count
        total_rating_sum += rating_sum

        normalized_status = _normalize_status(event.status)
        display_status = event.status
        if normalized_status == "published" and _is_past_event_date(event.date):
            display_status = "Terminé"

        by_event.append(
            {
                "event_id": event.id,
                "title": event.title,
                "status": display_status,
                "date": event.date,
                "location": event.location,
                "capacity": event.capacity,
                "attendees": event.attendees,
                "revenue": round(revenue, 2),
                "tickets_sold": tickets_sold,
                "paid_orders": int(order_stats["paid_orders"]),
                "comments_count": comments_count,
                "average_rating": average_rating,
            }
        )

    global_average_rating = round(total_rating_sum / total_comments, 2) if total_comments > 0 else None

    return {
        "summary": {
            "total_events": len(events),
            "published_events": published_events,
            "draft_events": draft_events,
            "finished_events": finished_events,
            "total_revenue": round(total_revenue, 2),
            "total_tickets_sold": total_tickets_sold,
            "total_comments": total_comments,
            "average_rating": global_average_rating,
            "currency": "USD",
        },
        "by_event": by_event,
    }


def get_admin_dashboard_stats(db: Session) -> dict:
    events = (
        db.query(Event)
        .order_by(Event.date.desc())
        .all()
    )

    if not events:
        return {
            "summary": {
                "total_events": 0,
                "published_events": 0,
                "draft_events": 0,
                "finished_events": 0,
                "total_revenue": 0.0,
                "total_tickets_sold": 0,
                "total_comments": 0,
                "average_rating": None,
                "currency": "USD",
            },
            "by_event": [],
        }

    event_ids = [event.id for event in events]

    paid_stats_rows = (
        db.query(
            OrderItem.event_id.label("event_id"),
            func.coalesce(func.sum(OrderItem.subtotal), 0.0).label("revenue"),
            func.coalesce(func.sum(OrderItem.quantity), 0).label("tickets_sold"),
            func.count(func.distinct(OrderItem.order_id)).label("paid_orders"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .filter(
            OrderItem.event_id.in_(event_ids),
            Order.payment_status == "PAID",
        )
        .group_by(OrderItem.event_id)
        .all()
    )

    paid_stats_by_event: dict[int, dict] = {}
    for row in paid_stats_rows:
        paid_stats_by_event[int(row.event_id)] = {
            "revenue": float(row.revenue or 0.0),
            "tickets_sold": int(row.tickets_sold or 0),
            "paid_orders": int(row.paid_orders or 0),
        }

    comment_stats_by_event: dict[int, dict] = {}
    try:
        from app.services import comment_service

        comment_stats_by_event = comment_service.get_comment_stats_for_events(event_ids)
    except Exception:
        comment_stats_by_event = {}

    published_events = 0
    draft_events = 0
    finished_events = 0

    for event in events:
        normalized_status = _normalize_status(event.status)
        if normalized_status == "draft":
            draft_events += 1
            continue

        if normalized_status == "finished":
            finished_events += 1
            continue

        if normalized_status == "published":
            if _is_past_event_date(event.date):
                finished_events += 1
            else:
                published_events += 1

    total_revenue = 0.0
    total_tickets_sold = 0
    total_comments = 0
    total_rating_sum = 0.0

    by_event = []
    for event in events:
        order_stats = paid_stats_by_event.get(
            event.id,
            {
                "revenue": 0.0,
                "tickets_sold": 0,
                "paid_orders": 0,
            },
        )
        comments_stats = comment_stats_by_event.get(
            event.id,
            {
                "comments_count": 0,
                "average_rating": None,
                "rating_sum": 0.0,
            },
        )

        comments_count = int(comments_stats.get("comments_count") or 0)
        average_rating_value = comments_stats.get("average_rating")
        average_rating = round(float(average_rating_value), 2) if average_rating_value is not None else None
        rating_sum = float(comments_stats.get("rating_sum") or 0.0)

        revenue = float(order_stats["revenue"])
        tickets_sold = int(order_stats["tickets_sold"])

        total_revenue += revenue
        total_tickets_sold += tickets_sold
        total_comments += comments_count
        total_rating_sum += rating_sum

        normalized_status = _normalize_status(event.status)
        display_status = event.status
        if normalized_status == "published" and _is_past_event_date(event.date):
            display_status = "Terminé"

        by_event.append(
            {
                "event_id": event.id,
                "title": event.title,
                "status": display_status,
                "date": event.date,
                "location": event.location,
                "capacity": event.capacity,
                "attendees": event.attendees,
                "revenue": round(revenue, 2),
                "tickets_sold": tickets_sold,
                "paid_orders": int(order_stats["paid_orders"]),
                "comments_count": comments_count,
                "average_rating": average_rating,
            }
        )

    global_average_rating = round(total_rating_sum / total_comments, 2) if total_comments > 0 else None

    return {
        "summary": {
            "total_events": len(events),
            "published_events": published_events,
            "draft_events": draft_events,
            "finished_events": finished_events,
            "total_revenue": round(total_revenue, 2),
            "total_tickets_sold": total_tickets_sold,
            "total_comments": total_comments,
            "average_rating": global_average_rating,
            "currency": "USD",
        },
        "by_event": by_event,
    }


def get_event_by_id(db: Session, event_id: int):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event:
        return _event_to_dict(event)
    return None


def update_event(
    db: Session,
    event_id: int,
    data: EventUpdate,
    actor_user_id: int,
    actor_role_name: str | None = None,
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None
    is_admin = _is_admin_role(actor_role_name)

    if not is_admin and event.organizer_id != actor_user_id:
        return "forbidden"

    updates = data.model_dump(exclude_unset=True, exclude={"tickets"})

    if not is_admin and "status" in updates:
        current_status = _normalize_status(event.status)
        requested_status = _normalize_status(updates.get("status"))
        if current_status == "depublished" and requested_status == "published":
            return "admin_depublished_lock"

    for key, value in updates.items():
        setattr(event, key, value)

    if data.tickets is not None:
        # Full replace strategy for now (simple and explicit for organizer workflow)
        event.ticket_types.clear()
        for ticket_type in _build_ticket_types(data.tickets):
            event.ticket_types.append(ticket_type)

    db.commit()
    db.refresh(event)
    return _event_to_dict(event)


def delete_event(
    db: Session,
    event_id: int,
    actor_user_id: int,
    actor_role_name: str | None = None,
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None
    is_admin = _is_admin_role(actor_role_name)

    if not is_admin and event.organizer_id != actor_user_id:
        return "forbidden"

    result = _event_to_dict(event)
    db.delete(event)
    db.commit()
    return result
