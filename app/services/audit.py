import json
from sqlalchemy.orm import Session
from app.models import AuditLog, User

def log_action(db: Session, user: User | None, action: str, resource_type: str | None = None, resource_id: str | int | None = None, details: dict | None = None, ip_address: str | None = None):
    entry = AuditLog(business_id=user.business_id if user else None, user_id=user.id if user else None, action=action, resource_type=resource_type, resource_id=str(resource_id) if resource_id is not None else None, details=json.dumps(details) if details else None, ip_address=ip_address)
    db.add(entry)
