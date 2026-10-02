from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import User, Order, OrderItem, Product, Inventory, AuditLog, AgentEvent, Supplier

router = APIRouter(prefix="/api/insights", tags=["insights"])

@router.get("/analytics")
def analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bid = user.business_id
    orders_q = db.query(Order).filter(Order.business_id == bid)
    if user.role == "customer":
        orders_q = orders_q.filter(Order.customer_id == user.id)
    revenue = orders_q.filter(Order.status != "cancelled").with_entities(func.coalesce(func.sum(Order.total_amount), 0)).scalar() or 0
    pending = orders_q.filter(Order.status.in_(["pending", "confirmed", "processing"])).count()
    products = db.query(Product).filter(Product.business_id == bid).count()
    inventory_rows = db.query(Inventory).join(Product).filter(Product.business_id == bid).all()
    low = sum(1 for x in inventory_rows if x.quantity <= x.reorder_level and x.quantity > 0)
    out = sum(1 for x in inventory_rows if x.quantity <= 0)
    top = (db.query(Product.name, func.sum(OrderItem.quantity).label("units"))
           .join(OrderItem, OrderItem.product_id == Product.id)
           .join(Order, Order.id == OrderItem.order_id)
           .filter(Product.business_id == bid, Order.status != "cancelled")
           .group_by(Product.id).order_by(func.sum(OrderItem.quantity).desc()).limit(5).all())
    statuses = (orders_q.with_entities(Order.status, func.count(Order.id)).group_by(Order.status).all())
    days = []
    today = datetime.now(timezone.utc).date()
    for offset in range(6, -1, -1):
        day = today - timedelta(days=offset)
        start = datetime(day.year, day.month, day.day, tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        amount = orders_q.filter(Order.created_at >= start, Order.created_at < end, Order.status != "cancelled").with_entities(func.coalesce(func.sum(Order.total_amount), 0)).scalar() or 0
        days.append({"date": day.isoformat(), "revenue": float(amount)})
    return {"revenue": float(revenue), "pending_orders": pending, "products": products, "low_stock": low, "out_of_stock": out,
            "top_products": [{"name": n, "units": int(u or 0)} for n, u in top],
            "order_statuses": [{"status": s, "count": int(c)} for s, c in statuses], "daily_revenue": days}

@router.get("/audit")
def audit(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in {"owner", "admin"}:
        raise HTTPException(403, "Owner/admin security access required")
    rows = db.query(AuditLog).filter(AuditLog.business_id == user.business_id).order_by(AuditLog.created_at.desc()).limit(100).all()
    return [{"id": r.id, "user_id": r.user_id, "action": r.action, "entity_type": r.entity_type, "entity_id": r.entity_id,
             "details": r.details, "created_at": r.created_at.isoformat()} for r in rows]
