from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import User, Product
from app.auth.dependencies import get_current_user, require_roles, require_csrf
from app.schemas.schemas import ProductPatch
from app.services.audit import log_action
router=APIRouter(prefix="/api/inventory",tags=["inventory"])
@router.get("")
def inventory(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    products=db.query(Product).options(joinedload(Product.inventory)).filter(Product.business_id==user.business_id).all()
    return [{"product_id":p.id,"product":p.name,"stock":p.inventory.quantity if p.inventory else 0,"reorder_level":p.inventory.reorder_level if p.inventory else 0,"low_stock":bool(p.inventory and p.inventory.quantity<=p.inventory.reorder_level)} for p in products]
@router.patch("/{product_id}",dependencies=[Depends(require_roles("owner","admin")),Depends(require_csrf)])
def update_stock(product_id:int,stock:int,reorder_level:int|None=None,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    if stock<0 or (reorder_level is not None and reorder_level<0): raise HTTPException(400,"Stock values cannot be negative")
    p=db.query(Product).options(joinedload(Product.inventory)).filter(Product.id==product_id,Product.business_id==user.business_id).first()
    if not p: raise HTTPException(404,"Product not found")
    if not p.inventory: from app.models import Inventory; p.inventory=Inventory(quantity=stock,reorder_level=reorder_level or 5)
    else: p.inventory.quantity=stock; p.inventory.reorder_level=reorder_level if reorder_level is not None else p.inventory.reorder_level
    log_action(db,user,"update_inventory","inventory",p.inventory.id,details={"product_id":p.id,"stock":stock}); db.commit(); return {"message":"Inventory updated"}
