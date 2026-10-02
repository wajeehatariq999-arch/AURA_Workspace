from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Business, BusinessSettings, User
from app.schemas.schemas import BusinessUpdate, SettingsUpdate, StaffIn, UserOut
from app.auth.dependencies import get_current_user, require_roles, require_csrf
from app.auth.security import hash_password
from app.services.audit import log_action
from app.services.storage import save_logo_image, delete_logo_image, LOGO_DIR

router = APIRouter(prefix="/api/business", tags=["business"])
owner_dep = require_roles("owner", "admin")

@router.get("")
def get_business(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.get(Business, user.business_id); s = b.settings
    return {"id": b.id, "name": b.name, "logo_path": b.logo_path, "description": b.description, "contact_email": b.contact_email, "contact_phone": b.contact_phone, "address": b.address, "currency": b.currency, "policies": s.policies if s else None, "business_hours": s.business_hours if s else None, "low_stock_threshold": s.low_stock_threshold if s else 5}

@router.put("", dependencies=[Depends(owner_dep), Depends(require_csrf)])
def update_business(payload: BusinessUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.get(Business, user.business_id); b.name=payload.name.strip(); b.description=payload.description; b.contact_email=str(payload.contact_email) if payload.contact_email else None; b.contact_phone=payload.contact_phone; b.address=payload.address; b.currency=payload.currency.upper()
    log_action(db,user,"update_business","business",b.id); db.commit(); return {"message":"Business updated"}

@router.put("/settings", dependencies=[Depends(owner_dep), Depends(require_csrf)])
def update_settings(payload: SettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    b=db.get(Business,user.business_id); s=b.settings or BusinessSettings(business_id=b.id); b.settings=s
    s.policies=payload.policies; s.business_hours=payload.business_hours; s.low_stock_threshold=payload.low_stock_threshold
    log_action(db,user,"update_settings","business_settings",s.id); db.commit(); return {"message":"Settings updated"}

@router.post("/staff", response_model=UserOut, dependencies=[Depends(owner_dep), Depends(require_csrf)])
def add_staff(payload: StaffIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    email=payload.email.lower()
    if db.query(User).filter(User.business_id==user.business_id, User.email==email).first(): raise HTTPException(409,"Email already exists in this business")
    member=User(business_id=user.business_id,full_name=payload.full_name,email=email,password_hash=hash_password(payload.password),role=payload.role)
    db.add(member); log_action(db,user,"create_user","user",details={"email":email,"role":payload.role}); db.commit(); db.refresh(member); return member

@router.get("/staff", response_model=list[UserOut], dependencies=[Depends(owner_dep)])
def list_staff(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(User).filter(User.business_id==user.business_id).order_by(User.created_at.desc()).all()

@router.patch("/staff/{user_id}", dependencies=[Depends(owner_dep), Depends(require_csrf)])
def toggle_staff(user_id:int, active: bool, user:User=Depends(get_current_user), db:Session=Depends(get_db)):
    member=db.query(User).filter(User.id==user_id,User.business_id==user.business_id).first()
    if not member: raise HTTPException(404,"User not found")
    if member.id==user.id: raise HTTPException(400,"Owner cannot deactivate their own account")
    member.is_active=active; log_action(db,user,"update_user","user",member.id,details={"is_active":active}); db.commit(); return {"message":"User updated"}


@router.post("/logo", dependencies=[Depends(owner_dep), Depends(require_csrf)])
async def upload_logo(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    b = db.get(Business, user.business_id)
    storage, original, size = await save_logo_image(file)
    if b.logo_path:
        delete_logo_image(b.logo_path)
    b.logo_path = storage
    log_action(db, user, "upload_business_logo", "business", b.id)
    db.commit()
    return {"url": f"/api/business/logo/{storage}"}
