"""
Migration helper for Sprint 4+5 payment fields.

Adds Stripe/payment columns to orders table if missing.

Run from backend/:
    python migrate_order_payment_fields.py
"""

from sqlalchemy import text

from app.database import engine


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


def index_exists(conn, table_name: str, index_name: str) -> bool:
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
    return count > 0


def main():
    with engine.begin() as conn:
        if not column_exists(conn, "orders", "payment_status"):
            conn.execute(text("ALTER TABLE orders ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID'"))

        if not column_exists(conn, "orders", "payment_provider"):
            conn.execute(text("ALTER TABLE orders ADD COLUMN payment_provider VARCHAR(30) NULL"))

        if not column_exists(conn, "orders", "payment_currency"):
            conn.execute(text("ALTER TABLE orders ADD COLUMN payment_currency VARCHAR(10) NOT NULL DEFAULT 'usd'"))

        if not column_exists(conn, "orders", "stripe_session_id"):
            conn.execute(text("ALTER TABLE orders ADD COLUMN stripe_session_id VARCHAR(191) NULL"))
        else:
            conn.execute(text("ALTER TABLE orders MODIFY stripe_session_id VARCHAR(191) NULL"))

        if not column_exists(conn, "orders", "stripe_payment_intent_id"):
            conn.execute(text("ALTER TABLE orders ADD COLUMN stripe_payment_intent_id VARCHAR(191) NULL"))
        else:
            conn.execute(text("ALTER TABLE orders MODIFY stripe_payment_intent_id VARCHAR(191) NULL"))

        if not column_exists(conn, "orders", "paid_at"):
            conn.execute(text("ALTER TABLE orders ADD COLUMN paid_at DATETIME NULL"))

        if not column_exists(conn, "orders", "updated_at"):
            conn.execute(
                text(
                    "ALTER TABLE orders ADD COLUMN updated_at DATETIME NOT NULL "
                    "DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
                )
            )

        if not index_exists(conn, "orders", "ix_orders_stripe_session_id"):
            conn.execute(text("ALTER TABLE orders ADD UNIQUE INDEX ix_orders_stripe_session_id (stripe_session_id)"))

        if not index_exists(conn, "orders", "ix_orders_stripe_payment_intent_id"):
            conn.execute(text("ALTER TABLE orders ADD INDEX ix_orders_stripe_payment_intent_id (stripe_payment_intent_id)"))

        # Harmonize old orders created before Stripe integration.
        conn.execute(
            text(
                """
                UPDATE orders
                SET payment_status = CASE
                    WHEN status IN ('PAID', 'CONFIRMED') THEN 'PAID'
                    WHEN status = 'PENDING_PAYMENT' THEN 'PENDING'
                    WHEN status = 'PAYMENT_FAILED' THEN 'FAILED'
                    WHEN status = 'PAYMENT_CANCELED' THEN 'CANCELED'
                    WHEN status = 'CART' THEN 'UNPAID'
                    ELSE payment_status
                END
                WHERE payment_status IS NULL OR payment_status = '' OR payment_status = 'UNPAID'
                """
            )
        )

        conn.execute(
            text(
                """
                UPDATE orders
                SET paid_at = COALESCE(paid_at, created_at)
                WHERE status IN ('PAID', 'CONFIRMED') AND paid_at IS NULL
                """
            )
        )

    print("Migration terminée: champs paiement Stripe prêts.")


if __name__ == "__main__":
    main()
