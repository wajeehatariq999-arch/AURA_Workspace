from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# SQLite cannot create a database file when its parent directory does not exist.
# This matters on fresh deployments such as Railway, where the local data folder
# is not present in the source checkout.
if settings.database_url.startswith("sqlite"):
    Path("data").mkdir(parents=True, exist_ok=True)

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, future=True)

def ensure_schema_compatibility():
    if not settings.database_url.startswith("sqlite"):
        return
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if "orders" in inspector.get_table_names():
        columns = {col["name"] for col in inspector.get_columns("orders")}
        if "expected_delivery_date" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE orders ADD COLUMN expected_delivery_date DATE"))

ensure_schema_compatibility()

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
