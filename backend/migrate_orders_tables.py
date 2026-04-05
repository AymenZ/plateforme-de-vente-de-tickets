"""
Migration helper for Sprint 3 (T3.04).

Creates/updates relational tables for orders and order_items,
including migration from single-event order schema to cart schema.

Run from backend/:
    python migrate_orders_tables.py
"""

from sqlalchemy import text

from app.database import engine


CREATE_ORDERS_SQL = """
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CART',
    total_amount FLOAT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX ix_orders_user_id (user_id),
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""

CREATE_ORDER_ITEMS_SQL = """
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    ticket_type_id INT NOT NULL,
    event_id INT NULL,
    event_title VARCHAR(255) NULL,
    ticket_name VARCHAR(100) NOT NULL,
    unit_price FLOAT NOT NULL,
    quantity INT NOT NULL,
    subtotal FLOAT NOT NULL,
    INDEX ix_order_items_order_id (order_id),
    INDEX ix_order_items_ticket_type_id (ticket_type_id),
    INDEX ix_order_items_event_id (event_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_order_items_ticket_type
        FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
"""


def column_exists(conn, table_name: str, column_name: str) -> bool:
    query = text(
        """
        SELECT COUNT(*)
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table_name
          AND COLUMN_NAME = :column_name
        """
    )
    count = conn.execute(query, {"table_name": table_name, "column_name": column_name}).scalar() or 0
    return count > 0


def fk_exists(conn, table_name: str, constraint_name: str) -> bool:
    query = text(
        """
        SELECT COUNT(*)
        FROM information_schema.TABLE_CONSTRAINTS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table_name
          AND CONSTRAINT_NAME = :constraint_name
          AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        """
    )
    count = conn.execute(query, {"table_name": table_name, "constraint_name": constraint_name}).scalar() or 0
    return count > 0


def ensure_index(conn, table_name: str, index_name: str, ddl: str):
    query = text(
        """
        SELECT COUNT(*)
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = :table_name
          AND INDEX_NAME = :index_name
        """
    )
    count = conn.execute(query, {"table_name": table_name, "index_name": index_name}).scalar() or 0
    if count == 0:
        conn.execute(text(ddl))


def main():
    with engine.begin() as conn:
        conn.execute(text(CREATE_ORDERS_SQL))
        conn.execute(text(CREATE_ORDER_ITEMS_SQL))

        # Backward compatibility migration: old schema had orders.event_id
        if column_exists(conn, "orders", "event_id"):
            if not column_exists(conn, "order_items", "event_id"):
                conn.execute(text("ALTER TABLE order_items ADD COLUMN event_id INT NULL"))

            if not column_exists(conn, "order_items", "event_title"):
                conn.execute(text("ALTER TABLE order_items ADD COLUMN event_title VARCHAR(255) NULL"))

            conn.execute(
                text(
                    """
                    UPDATE order_items oi
                    JOIN orders o ON o.id = oi.order_id
                    LEFT JOIN events e ON e.id = o.event_id
                    SET oi.event_id = o.event_id,
                        oi.event_title = COALESCE(e.title, oi.event_title)
                    WHERE oi.event_id IS NULL
                    """
                )
            )

            if fk_exists(conn, "orders", "fk_orders_event"):
                conn.execute(text("ALTER TABLE orders DROP FOREIGN KEY fk_orders_event"))

            try:
                conn.execute(text("ALTER TABLE orders DROP INDEX ix_orders_event_id"))
            except Exception:
                pass

            conn.execute(text("ALTER TABLE orders DROP COLUMN event_id"))

        # Ensure order_items has NOT NULL + FK/index for event linkage
        if column_exists(conn, "order_items", "event_id"):
            conn.execute(
                text(
                    """
                    UPDATE order_items oi
                    JOIN ticket_types tt ON tt.id = oi.ticket_type_id
                    JOIN events e ON e.id = tt.event_id
                    SET oi.event_id = tt.event_id,
                        oi.event_title = COALESCE(oi.event_title, e.title)
                    WHERE oi.event_id IS NULL
                    """
                )
            )

            unresolved = conn.execute(
                text("SELECT COUNT(*) FROM order_items WHERE event_id IS NULL")
            ).scalar() or 0
            if unresolved > 0:
                raise RuntimeError(
                    "Migration stoppée: certaines lignes order_items n'ont pas de event_id résolu"
                )

            conn.execute(
                text(
                    """
                    UPDATE order_items oi
                    JOIN events e ON e.id = oi.event_id
                    SET oi.event_title = COALESCE(NULLIF(oi.event_title, ''), e.title)
                    """
                )
            )

            missing_titles = conn.execute(
                text("SELECT COUNT(*) FROM order_items WHERE event_title IS NULL OR event_title = ''")
            ).scalar() or 0
            if missing_titles > 0:
                raise RuntimeError(
                    "Migration stoppée: certaines lignes order_items n'ont pas de event_title"
                )

            conn.execute(text("ALTER TABLE order_items MODIFY event_id INT NOT NULL"))
            conn.execute(text("ALTER TABLE order_items MODIFY event_title VARCHAR(255) NOT NULL"))

        ensure_index(
            conn,
            "order_items",
            "ix_order_items_event_id",
            "ALTER TABLE order_items ADD INDEX ix_order_items_event_id (event_id)",
        )

        if not fk_exists(conn, "order_items", "fk_order_items_event"):
            conn.execute(
                text(
                    "ALTER TABLE order_items ADD CONSTRAINT fk_order_items_event "
                    "FOREIGN KEY (event_id) REFERENCES events(id)"
                )
            )

    print("Migration terminée: schema panier multi-evenements prêt.")


if __name__ == "__main__":
    main()
