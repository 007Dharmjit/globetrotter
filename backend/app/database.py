import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is missing. Copy backend/.env.example to backend/.env and fill it in.")

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_columns():
    """Add columns introduced after a database was first created, without touching existing rows."""
    statements = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar varchar(255)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true",
        "ALTER TABLE trips ADD COLUMN IF NOT EXISTS cover_image varchar(255)",
        # Added nullable, filled from the order the activities were already shown in, then locked
        # down. Rows that already carry a position are left alone, so a re-run never reshuffles.
        "ALTER TABLE stop_activities ADD COLUMN IF NOT EXISTS order_index integer",
        """
        UPDATE stop_activities planned
        SET order_index = ranked.position
        FROM (
            SELECT id, row_number() OVER (
                PARTITION BY stop_id ORDER BY scheduled_date, start_time NULLS FIRST, id
            ) - 1 AS position
            FROM stop_activities
        ) ranked
        WHERE planned.id = ranked.id AND planned.order_index IS NULL
        """,
        "ALTER TABLE stop_activities ALTER COLUMN order_index SET DEFAULT 0",
        "ALTER TABLE stop_activities ALTER COLUMN order_index SET NOT NULL",
    ]
    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))
