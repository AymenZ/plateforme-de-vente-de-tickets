"""
Migration helper for Sprint 3 (T3.03).

Creates the `ticket_types` table and migrates legacy JSON tickets from `events.tickets`
into relational rows.

Run from backend/:
    python migrate_tickets_to_ticket_types.py
"""

import json
from sqlalchemy import text

from app.database import engine


CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS ticket_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price FLOAT NOT NULL DEFAULT 0,
    quantity INT NOT NULL DEFAULT 0,
    sold INT NOT NULL DEFAULT 0,
    event_id INT NOT NULL,
    INDEX ix_ticket_types_id (id),
    INDEX ix_ticket_types_event_id (event_id),
    CONSTRAINT fk_ticket_types_event
        FOREIGN KEY (event_id) REFERENCES events(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

SELECT_EVENTS_SQL = "SELECT id, tickets FROM events WHERE tickets IS NOT NULL AND tickets <> ''"
COUNT_EXISTING_SQL = text("SELECT COUNT(*) FROM ticket_types WHERE event_id = :event_id")

INSERT_TICKET_SQL = text(
    """
    INSERT INTO ticket_types (name, price, quantity, sold, event_id)
    VALUES (:name, :price, :quantity, :sold, :event_id)
    """
)


def main():
    with engine.begin() as conn:
        conn.execute(text(CREATE_TABLE_SQL))

        rows = conn.execute(text(SELECT_EVENTS_SQL)).fetchall()
        migrated = 0

        for row in rows:
            event_id = row[0]
            raw_tickets = row[1]

            existing_count = conn.execute(
                COUNT_EXISTING_SQL, {"event_id": event_id}
            ).scalar() or 0
            if existing_count > 0:
                # Already migrated for this event
                continue

            try:
                tickets = json.loads(raw_tickets)
            except Exception:
                print(f"[WARN] Event #{event_id}: impossible de parser le JSON tickets")
                continue

            if not isinstance(tickets, list):
                print(f"[WARN] Event #{event_id}: tickets n'est pas une liste")
                continue

            for ticket in tickets:
                if not isinstance(ticket, dict):
                    continue

                name = str(ticket.get("name") or "Standard").strip() or "Standard"
                price = float(ticket.get("price") or 0)
                quantity = int(ticket.get("quantity") or 0)

                conn.execute(
                    INSERT_TICKET_SQL,
                    {
                        "name": name,
                        "price": price,
                        "quantity": quantity,
                        "sold": 0,
                        "event_id": event_id,
                    },
                )
                migrated += 1

    print(f"Migration terminée. Types de tickets migrés: {migrated}")
    print("Optionnel ensuite: ALTER TABLE events DROP COLUMN tickets;")


if __name__ == "__main__":
    main()
