from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product, Inventory, Order, Supplier, User
from app.auth.dependencies import get_current_user
router=APIRouter(prefix="/api/dashboard",tags=["dashboard"])
@router.get("")
def dashboard(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    bid=user.business_id
    product_count=db.query(func.count(Product.id)).filter(Product.business_id==bid).scalar() or 0
    supplier_count=db.query(func.count(Supplier.id)).filter(Supplier.business_id==bid).scalar() or 0
    order_count=db.query(func.count(Order.id)).filter(Order.business_id==bid).scalar() or 0
    low_stock=db.query(func.count(Inventory.id)).join(Product).filter(Product.business_id==bid,Inventory.quantity<=Inventory.reorder_level).scalar() or 0
    return {"products":product_count,"suppliers":supplier_count,"orders":order_count,"low_stock":low_stock}
