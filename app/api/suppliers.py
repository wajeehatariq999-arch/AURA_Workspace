from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Supplier, User
from app.schemas.schemas import SupplierIn
from app.auth.dependencies import get_current_user, require_roles, require_csrf
from app.services.audit import log_action
router=APIRouter(prefix="/api/suppliers",tags=["suppliers"])
admin=Depends(require_roles("owner","admin"))
@router.get("")
def list_suppliers(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    return [{"id":s.id,"name":s.name,"contact_name":s.contact_name,"email":s.email,"phone":s.phone,"address":s.address} for s in db.query(Supplier).filter(Supplier.business_id==user.business_id).order_by(Supplier.name).all()]
@router.post("",dependencies=[admin,Depends(require_csrf)])
def add_supplier(payload:SupplierIn,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    s=Supplier(business_id=user.business_id,**payload.model_dump()); db.add(s); db.flush(); log_action(db,user,"create_supplier","supplier",s.id); db.commit(); return {"id":s.id,"name":s.name}
@router.patch("/{supplier_id}",dependencies=[admin,Depends(require_csrf)])
def update_supplier(supplier_id:int,payload:SupplierIn,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    s=db.query(Supplier).filter(Supplier.id==supplier_id,Supplier.business_id==user.business_id).first()
    if not s: raise HTTPException(404,"Supplier not found")
    for k,v in payload.model_dump().items(): setattr(s,k,v)
    log_action(db,user,"update_supplier","supplier",s.id); db.commit(); return {"message":"Supplier updated"}
@router.delete("/{supplier_id}",dependencies=[admin,Depends(require_csrf)])
def delete_supplier(supplier_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    s=db.query(Supplier).filter(Supplier.id==supplier_id,Supplier.business_id==user.business_id).first()
    if not s: raise HTTPException(404,"Supplier not found")
    db.delete(s); log_action(db,user,"delete_supplier","supplier",s.id); db.commit(); return {"message":"Supplier deleted"}
