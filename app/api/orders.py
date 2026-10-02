from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Order, OrderItem, Product, User
from app.schemas.schemas import OrderIn, OrderStatusIn
from app.auth.dependencies import get_current_user, require_roles, require_csrf
from app.services.audit import log_action
router=APIRouter(prefix="/api/orders",tags=["orders"])

def serialize(o): return {"id":o.id,"status":o.status,"total_amount":float(o.total_amount),"notes":o.notes,"created_at":o.created_at.isoformat(),"items":[{"product_id":i.product_id,"product":i.product.name,"quantity":i.quantity,"unit_price":float(i.unit_price)} for i in o.items]}
@router.get("")
def list_orders(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    q=db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product)).filter(Order.business_id==user.business_id)
    if user.role=="customer": q=q.filter(Order.customer_id==user.id)
    return [serialize(o) for o in q.order_by(Order.created_at.desc()).all()]
@router.post("",dependencies=[Depends(require_csrf)])
def create_order(payload:OrderIn,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    ids=[x.product_id for x in payload.items]
    products={p.id:p for p in db.query(Product).filter(Product.business_id==user.business_id,Product.id.in_(ids)).all()}
    if len(products)!=len(set(ids)): raise HTTPException(400,"One or more products are invalid")
    order=Order(business_id=user.business_id,customer_id=user.id if user.role=="customer" else None,status="pending",notes=payload.notes,total_amount=Decimal("0")); db.add(order); db.flush()
    total=Decimal("0")
    for item in payload.items:
        p=products[item.product_id]
        if not p.is_available or not p.inventory or p.inventory.quantity<item.quantity: raise HTTPException(400,f"Product unavailable or insufficient stock: {p.name}")
        oi=OrderItem(order_id=order.id,product_id=p.id,quantity=item.quantity,unit_price=p.price); db.add(oi); total+=p.price*item.quantity; p.inventory.quantity-=item.quantity
    order.total_amount=total; log_action(db,user,"create_order","order",order.id); db.commit(); db.refresh(order); return serialize(order)
@router.patch("/{order_id}/status",dependencies=[Depends(require_roles("owner","admin","staff")),Depends(require_csrf)])
def update_status(order_id:int,payload:OrderStatusIn,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    o=db.query(Order).filter(Order.id==order_id,Order.business_id==user.business_id).first()
    if not o: raise HTTPException(404,"Order not found")
    o.status=payload.status; log_action(db,user,"update_order_status","order",o.id,details={"status":o.status}); db.commit(); return {"message":"Order status updated"}
