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

def ensure_demo_catalog(db, business_id):
    """Restore a small demo catalog when the business has no products yet."""
    if db.query(Product).filter(Product.business_id == business_id).first():
        return

    categories = {
        c.name: c
        for c in db.query(ProductCategory).filter(
            ProductCategory.business_id == business_id
        ).all()
    }

    category_specs = [
        ("Fashion & Clothing", "Clothing, shirts, dresses and everyday fashion."),
        ("Shoes & Footwear", "Sneakers, shoes and everyday footwear."),
        ("Jewellery & Accessories", "Jewellery, watches and everyday accessories."),
        ("Home & Living", "Home decoration and lifestyle essentials."),
        ("Bags", "Handbags, shoulder bags and everyday bags."),
        ("Beauty & Personal Care", "Beauty and personal care products."),
        ("Electronics & Gadgets", "Electronics and modern gadgets."),
        ("Gifts & Lifestyle", "Gift sets and lifestyle products."),
    ]

    for name, description in category_specs:
        if name not in categories:
            category = ProductCategory(
                business_id=business_id,
                name=name,
                description=description,
            )
            db.add(category)
            categories[name] = category

    db.flush()

    demo_products = [
        ("Classic Leather Handbag", "Elegant everyday handbag.", Decimal("4500.00"), "Bags", 12),
        ("Premium Wrist Watch", "Classic lifestyle wrist watch.", Decimal("6200.00"), "Jewellery & Accessories", 8),
        ("Casual Sneakers", "Comfortable everyday sneakers.", Decimal("5500.00"), "Shoes & Footwear", 10),
        ("Decorative Gift Set", "A stylish gift set for special occasions.", Decimal("2800.00"), "Gifts & Lifestyle", 15),
        ("Wireless Earbuds", "Compact wireless earbuds for everyday use.", Decimal("3900.00"), "Electronics & Gadgets", 9),
    ]

    colors = [
        ("#6f4b36", "#ead9b7"),
        ("#2d5145", "#e9dfc8"),
        ("#8d7650", "#f1e6d0"),
        ("#31534a", "#d9c59b"),
        ("#6d7759", "#eee2c8"),
    ]

    image_dir = BASE / "data" / "product_images"
    image_dir.mkdir(parents=True, exist_ok=True)

    for idx, (name, description, price, category_name, stock) in enumerate(demo_products):
        product = Product(
            business_id=business_id,
            name=name,
            description=description,
            price=price,
            category_id=categories[category_name].id,
            is_available=True,
        )
        product.inventory = Inventory(
            quantity=stock,
            reorder_level=5,
        )
        db.add(product)
        db.flush()

        c1, c2 = colors[idx]
        safe_name = name.replace("&", "and")
        storage = f"demo-{product.id}.svg"
        content = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" '
            f'viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" x2="1" '
            f'y1="0" y2="1"><stop stop-color="{c1}"/><stop offset="1" '
            f'stop-color="{c2}"/></linearGradient></defs><rect width="1200" '
            f'height="900" fill="url(#g)"/><text x="90" y="170" fill="#fff" '
            f'opacity=".8" font-family="Georgia,serif" font-size="34" '
            f'letter-spacing="6">AURA DEMO</text><text x="90" y="720" fill="#fff" '
            f'font-family="Georgia,serif" font-size="58">{safe_name}</text></svg>'
        )
        (image_dir / storage).write_text(content, encoding="utf-8")
        db.add(
            ProductImage(
                product_id=product.id,
                storage_name=storage,
                original_name=storage,
                mime_type="image/svg+xml",
                file_size=len(content.encode()),
                is_primary=True,
            )
        )


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
            business = db.get(Business, owner.business_id)
            if business:
                ensure_demo_catalog(db, business.id)
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
        db.flush()
        ensure_demo_catalog(db, business.id)
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
