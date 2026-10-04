from pathlib import Path
from decimal import Decimal
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.config import settings
from app.database import Base, engine
from app.api import auth, business, products, inventory, suppliers, orders, dashboard, ai, insights, feedback
from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import ProductImage, Product, Business, BusinessSettings, User, ProductCategory, Inventory
from app.auth.security import hash_password

BASE=Path(__file__).resolve().parent.parent
for path in [BASE/"data"/"uploads",BASE/"data"/"product_images",BASE/"data"/"documents",BASE/"data"/"vector_store"]: path.mkdir(parents=True,exist_ok=True)
Base.metadata.create_all(bind=engine)

def ensure_fixed_owner():
    """Ensure the single configured business owner exists for a fresh deployment."""
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        owner = (
            db.query(User)
            .filter(User.email == settings.owner_email.lower())
            .first()
        )

        if owner:
            if owner.role not in {"owner", "admin"}:
                owner.role = "owner"
            owner.password_hash = hash_password(settings.owner_password)
            owner.is_active = True
            db.commit()
            return

        business = (
            db.query(Business)
            .filter(Business.name == settings.owner_business_name)
            .first()
        )

        if not business:
            business = Business(
                name=settings.owner_business_name,
                currency="PKR",
            )
            business.settings = BusinessSettings()
            db.add(business)
            db.flush()

            for name, description in [
                ("Fashion & Clothing", "Clothing, shirts, dresses and everyday fashion."),
                ("Shoes & Footwear", "Sneakers, shoes and everyday footwear."),
                ("Jewellery & Accessories", "Jewellery, watches and everyday accessories."),
                ("Home & Living", "Home decoration and lifestyle essentials."),
                ("Bags", "Handbags, shoulder bags and everyday bags."),
                ("Beauty & Personal Care", "Beauty and personal care products."),
                ("Electronics & Gadgets", "Electronics and modern gadgets."),
                ("Gifts & Lifestyle", "Gift sets and lifestyle products."),
            ]:
                db.add(
                    ProductCategory(
                        business_id=business.id,
                        name=name,
                        description=description,
                    )
                )

        owner = User(
            business_id=business.id,
            full_name="AURA Business Owner",
            email=settings.owner_email.lower(),
            password_hash=hash_password(settings.owner_password),
            role="owner",
            is_active=True,
        )
        db.add(owner)
        db.commit()
    finally:
        db.close()

ensure_fixed_owner()
app=FastAPI(title=settings.app_name,version="3.0.0",docs_url="/docs",redoc_url=None)
app.add_middleware(CORSMiddleware,allow_origins=settings.cors_origins,allow_credentials=True,allow_methods=["GET","POST","PUT","PATCH","DELETE","OPTIONS"],allow_headers=["Content-Type","Authorization","X-CSRF-Token"],max_age=600)
app.mount("/static",StaticFiles(directory=str(BASE/"frontend"/"static")),name="static")
templates=Jinja2Templates(directory=str(BASE/"frontend"/"templates"))
for r in [auth.router,business.router,products.router,inventory.router,suppliers.router,orders.router,dashboard.router,ai.router,insights.router,feedback.router]: app.include_router(r)

@app.get("/api/product-images/{storage_name}")
def protected_product_image(storage_name: str, user=Depends(get_current_user), db=Depends(get_db)):
    from pathlib import Path
    img = db.query(ProductImage).join(Product).filter(ProductImage.storage_name == Path(storage_name).name, Product.business_id == user.business_id).first()
    if not img: raise HTTPException(404, "Image not found")
    path = BASE / "data" / "product_images" / img.storage_name
    if not path.exists(): raise HTTPException(404, "Image not found")
    return FileResponse(path, media_type=img.mime_type)
@app.get("/",response_class=HTMLResponse)
def landing(request:Request): return templates.TemplateResponse(request=request, name="index.html", context={"request": request})
@app.get("/app",response_class=HTMLResponse)
def application(request:Request): return templates.TemplateResponse(request=request, name="app.html", context={"request": request})


@app.get("/api/business/logo/{storage_name}")
def protected_business_logo(storage_name: str, user=Depends(get_current_user), db=Depends(get_db)):
    from pathlib import Path
    b = db.get(Business, user.business_id)
    if not b or not b.logo_path or Path(b.logo_path).name != Path(storage_name).name: raise HTTPException(404, "Logo not found")
    path = BASE / "data" / "uploads" / "logos" / b.logo_path
    if not path.exists(): raise HTTPException(404, "Logo not found")
    return FileResponse(path)
