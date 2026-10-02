from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import User, Product, ProductCategory, Inventory, ProductImage
from app.schemas.schemas import ProductIn, ProductPatch, CategoryIn
from app.auth.dependencies import get_current_user, require_roles, require_csrf
from app.services.audit import log_action
from app.services.storage import save_product_image, delete_product_image

router=APIRouter(prefix="/api",tags=["products"]); admin=Depends(require_roles("owner","admin"))

def get_product(db,user,pid):
    p=db.query(Product).options(joinedload(Product.images),joinedload(Product.inventory),joinedload(Product.category)).filter(Product.id==pid,Product.business_id==user.business_id).first()
    if not p: raise HTTPException(404,"Product not found")
    return p

def serialize(p):
    return {"id":p.id,"name":p.name,"description":p.description,"price":float(p.price),"category_id":p.category_id,"category":p.category.name if p.category else None,"is_available":p.is_available,"stock":p.inventory.quantity if p.inventory else 0,"reorder_level":p.inventory.reorder_level if p.inventory else 0,"images":[{"id":i.id,"url":f"/api/product-images/{i.storage_name}","is_primary":i.is_primary} for i in p.images]}

@router.get("/products")
def list_products(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    return [serialize(p) for p in db.query(Product).options(joinedload(Product.images),joinedload(Product.inventory),joinedload(Product.category)).filter(Product.business_id==user.business_id).order_by(Product.created_at.desc()).all()]

@router.post("/products",dependencies=[admin,Depends(require_csrf)])
def create_product(payload:ProductIn,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    if payload.category_id and not db.query(ProductCategory).filter(ProductCategory.id==payload.category_id,ProductCategory.business_id==user.business_id).first(): raise HTTPException(400,"Invalid category")
    p=Product(business_id=user.business_id,name=payload.name.strip(),description=payload.description,price=payload.price,category_id=payload.category_id,is_available=payload.is_available)
    p.inventory=Inventory(quantity=payload.stock,reorder_level=payload.reorder_level); db.add(p); db.flush(); log_action(db,user,"create_product","product",p.id); db.commit(); db.refresh(p); return serialize(p)

@router.patch("/products/{pid}",dependencies=[admin,Depends(require_csrf)])
def update_product(pid:int,payload:ProductPatch,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    p=get_product(db,user,pid); data=payload.model_dump(exclude_unset=True); stock=data.pop("stock",None); reorder=data.pop("reorder_level",None)
    if "category_id" in data and data["category_id"] and not db.query(ProductCategory).filter(ProductCategory.id==data["category_id"],ProductCategory.business_id==user.business_id).first(): raise HTTPException(400,"Invalid category")
    for k,v in data.items(): setattr(p,k,v)
    if not p.inventory: p.inventory=Inventory(quantity=0,reorder_level=5)
    if stock is not None:p.inventory.quantity=stock
    if reorder is not None:p.inventory.reorder_level=reorder
    log_action(db,user,"update_product","product",p.id); db.commit(); return serialize(p)

@router.delete("/products/{pid}",dependencies=[admin,Depends(require_csrf)])
def delete_product(pid:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    p=get_product(db,user,pid)
    for img in list(p.images): delete_product_image(img.storage_name)
    db.delete(p); log_action(db,user,"delete_product","product",pid); db.commit(); return {"message":"Product deleted"}

@router.get("/categories")
def list_categories(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    return [{"id":c.id,"name":c.name,"description":c.description} for c in db.query(ProductCategory).filter(ProductCategory.business_id==user.business_id).order_by(ProductCategory.name).all()]

@router.post("/categories",dependencies=[admin,Depends(require_csrf)])
def create_category(payload:CategoryIn,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    if db.query(ProductCategory).filter(ProductCategory.business_id==user.business_id,ProductCategory.name==payload.name.strip()).first(): raise HTTPException(409,"Category already exists")
    c=ProductCategory(business_id=user.business_id,name=payload.name.strip(),description=payload.description); db.add(c); db.flush(); log_action(db,user,"create_category","category",c.id); db.commit(); return {"id":c.id,"name":c.name,"description":c.description}

@router.post("/products/{pid}/images",dependencies=[admin,Depends(require_csrf)])
async def upload_image(pid:int,file:UploadFile=File(...),primary:bool=False,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    p=get_product(db,user,pid); storage,original,size=await save_product_image(file)
    if primary:
        for old in p.images: old.is_primary=False
    elif not p.images: primary=True
    img=ProductImage(product_id=p.id,storage_name=storage,original_name=original,mime_type=file.content_type,file_size=size,is_primary=primary); db.add(img); log_action(db,user,"upload_product_image","product_image",details={"product_id":pid}); db.commit(); db.refresh(img); return {"id":img.id,"url":f"/api/product-images/{storage}","is_primary":img.is_primary}

@router.delete("/product-images/{image_id}",dependencies=[admin,Depends(require_csrf)])
def delete_image(image_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    img=db.query(ProductImage).join(Product).filter(ProductImage.id==image_id,Product.business_id==user.business_id).first()
    if not img: raise HTTPException(404,"Image not found")
    delete_product_image(img.storage_name); db.delete(img); log_action(db,user,"delete_product_image","product_image",image_id); db.commit(); return {"message":"Image deleted"}
