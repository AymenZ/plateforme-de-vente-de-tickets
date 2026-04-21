"""
Migration helper for Sprint 4+5 purchased tickets.

Creates the `tickets` table used after payment confirmation.

Run from backend/:
    python migrate_tickets_table.py
"""

from sqlalchemy import text

from app.database import engine


CREATE_TICKETS_SQL = """
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(120) NOT NULL,
    qr_value TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'VALID',

    order_id INT NOT NULL,
    order_item_id INT NULL,
    user_id INT NOT NULL,
    event_id INT NOT NULL,
    ticket_type_id INT NOT NULL,

    event_title VARCHAR(255) NOT NULL,
    ticket_name VARCHAR(100) NOT NULL,
    unit_price FLOAT NOT NULL DEFAULT 0,

    purchased_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME NULL,

    UNIQUE INDEX ux_tickets_ticket_code (ticket_code),
    INDEX ix_tickets_order_id (order_id),
    INDEX ix_tickets_order_item_id (order_item_id),
    INDEX ix_tickets_user_id (user_id),
    INDEX ix_tickets_event_id (event_id),
    INDEX ix_tickets_ticket_type_id (ticket_type_id),

    CONSTRAINT fk_tickets_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_order_item FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_tickets_event FOREIGN KEY (event_id) REFERENCES events(id),
    CONSTRAINT fk_tickets_ticket_type FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""


def main():
    with engine.begin() as conn:
        conn.execute(text(CREATE_TICKETS_SQL))

    print("Migration terminée: table tickets prête.")


if __name__ == "__main__":
    main()
