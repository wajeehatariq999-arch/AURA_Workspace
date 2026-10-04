
from decimal import Decimal
from pathlib import Path

from app.database import SessionLocal
from app.models import (
    Business, BusinessSettings, User, ProductCategory, Product,
    ProductImage, Inventory, Order, OrderItem
)
from app.auth.security import hash_password
from app.config import settings

BASE = Path(__file__).resolve().parent.parent
IMAGE_DIR = BASE / "data" / "product_images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

CATEGORIES = [
    ("Fashion & Clothing", "Clothing, shirts, dresses and everyday fashion."),
    ("Shoes & Footwear", "Sneakers, shoes and everyday footwear."),
    ("Jewellery & Accessories", "Jewellery, watches and everyday accessories."),
    ("Home & Living", "Home decoration and lifestyle essentials."),
    ("Bags", "Handbags, shoulder bags and everyday carry items."),
    ("Beauty & Personal Care", "Beauty, skincare and personal care products."),
    ("Electronics & Gadgets", "Useful electronics and modern gadgets."),
    ("Gifts & Lifestyle", "Gift sets and lifestyle products."),
]

PRODUCTS = [
    ("Linen Everyday Shirt", "A comfortable everyday shirt with a clean modern look.", 3200, "Fashion & Clothing", 20),
    ("Classic Street Sneakers", "Clean everyday sneakers designed for casual outfits.", 6500, "Shoes & Footwear", 15),
    ("Minimal Gold Earrings", "Elegant minimal earrings for everyday styling.", 2800, "Jewellery & Accessories", 18),
    ("Textured Shoulder Bag", "A practical shoulder bag with a refined everyday design.", 5200, "Bags", 10),
    ("AURA Body Care Set", "A simple personal-care set for an everyday self-care routine.", 3900, "Beauty & Personal Care", 12),
    ("Modern Table Lamp", "A simple modern lamp for a warm home setup.", 4200, "Home & Living", 10),
    ("Wireless Earbuds", "Compact wireless earbuds for everyday listening.", 6500, "Electronics & Gadgets", 12),
    ("AURA Gift Box", "A curated lifestyle gift box for special occasions.", 4800, "Gifts & Lifestyle", 8),
]

PHOTO_NAMES = {
    "Linen Everyday Shirt": ["casual-shirt.jpg", "casual-shirt.png", "casual-shirt.webp"],
    "Classic Street Sneakers": ["street-shoes.jpg", "street-shoes.png", "street-shoes.webp"],
    "Minimal Gold Earrings": ["gold-earings.jpg", "gold-earrings.jpg", "gold-earings.png"],
    "Textured Shoulder Bag": ["textured-bag.jpg", "textured-bag.png", "textured-bag.webp"],
    "AURA Body Care Set": ["skin-care.jpg", "skin-care.png", "skin-care.webp"],
    "Modern Table Lamp": ["table-lamp.jpg", "table-lamp.png", "table-lamp.webp"],
    "Wireless Earbuds": ["wireless-earbuds.jpg", "wireless-earbuds.png", "wireless-earbuds.webp"],
    "AURA Gift Box": ["gift-box.jpg", "gift-box.png", "gift-box.webp"],
}

def mime(name):
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
    }.get(Path(name).suffix.lower(), "application/octet-stream")

def make_svg(title, subtitle):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">'
        '<defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1">'
        '<stop stop-color="#173c32"/><stop offset="1" stop-color="#d4b77a"/>'
        '</linearGradient></defs>'
        '<rect width="1200" height="900" fill="url(#g)"/>'
        '<circle cx="930" cy="180" r="230" fill="#fff" opacity=".10"/>'
        '<circle cx="180" cy="760" r="260" fill="#fff" opacity=".08"/>'
        '<text x="90" y="150" fill="#fff" opacity=".75" font-family="Georgia,serif" '
        'font-size="32" letter-spacing="7">AURA</text>'
        f'<text x="90" y="660" fill="#fff" font-family="Georgia,serif" font-size="62">{title}</text>'
        f'<text x="90" y="720" fill="#fff" opacity=".82" font-family="Arial,sans-serif" font-size="26">{subtitle}</text>'
        '</svg>'
    )

def ensure_image(db, product):
    image = (
        db.query(ProductImage)
        .filter(ProductImage.product_id == product.id, ProductImage.is_primary == True)
        .first()
    )

    real = next(
        (name for name in PHOTO_NAMES.get(product.name, []) if (IMAGE_DIR / name).exists()),
        None,
    )

    if real:
        path = IMAGE_DIR / real
        if image:
            image.storage_name = real
            image.original_name = real
            image.mime_type = mime(real)
            image.file_size = path.stat().st_size
            image.is_primary = True
        else:
            db.add(ProductImage(
                product_id=product.id,
                storage_name=real,
                original_name=real,
                mime_type=mime(real),
                file_size=path.stat().st_size,
                is_primary=True,
            ))
        return

    storage = f"stage2-{product.id}.svg"
    path = IMAGE_DIR / storage
    if not path.exists():
        path.write_text(
            make_svg(product.name, product.category.name if product.category else "AURA"),
            encoding="utf-8",
        )

    if image:
        image.storage_name = storage
        image.original_name = storage
        image.mime_type = "image/svg+xml"
        image.file_size = path.stat().st_size
        image.is_primary = True
    else:
        db.add(ProductImage(
            product_id=product.id,
            storage_name=storage,
            original_name=storage,
            mime_type="image/svg+xml",
            file_size=path.stat().st_size,
            is_primary=True,
        ))

def ensure_catalog():
    db = SessionLocal()
    try:
        business = (
            db.query(Business)
            .filter(Business.name == settings.owner_business_name)
            .first()
        )

        if not business:
            business = Business(
                name=settings.owner_business_name,
                currency="PKR",
                description="AURA customer shopping store.",
            )
            business.settings = BusinessSettings()
            db.add(business)
            db.flush()

        categories = {}
        for name, description in CATEGORIES:
            category = (
                db.query(ProductCategory)
                .filter(
                    ProductCategory.business_id == business.id,
                    ProductCategory.name == name,
                )
                .first()
            )
            if not category:
                category = ProductCategory(
                    business_id=business.id,
                    name=name,
                    description=description,
                )
                db.add(category)
                db.flush()
            categories[name] = category

        owner = (
            db.query(User)
            .filter(User.email == settings.owner_email.lower())
            .first()
        )
        if not owner:
            owner = User(
                business_id=business.id,
                full_name="AURA Business Owner",
                email=settings.owner_email.lower(),
                password_hash=hash_password(settings.owner_password),
                role="owner",
                is_active=True,
            )
            db.add(owner)
        else:
            owner.business_id = business.id
            owner.role = "owner"
            owner.is_active = True
            owner.password_hash = hash_password(settings.owner_password)

        customer = (
            db.query(User)
            .filter(User.email == "customer@aurademo.com")
            .first()
        )
        if not customer:
            customer = User(
                business_id=business.id,
                full_name="Demo Customer",
                email="customer@aurademo.com",
                password_hash=hash_password("ChangeMe-123!"),
                role="customer",
                is_active=True,
            )
            db.add(customer)
            db.flush()

        db.flush()

        products = {}
        for name, description, price, category_name, stock in PRODUCTS:
            product = (
                db.query(Product)
                .filter(
                    Product.business_id == business.id,
                    Product.name == name,
                )
                .first()
            )

            if not product:
                product = Product(
                    business_id=business.id,
                    category_id=categories[category_name].id,
                    name=name,
                    description=description,
                    price=Decimal(str(price)),
                    is_available=True,
                )
                product.inventory = Inventory(quantity=stock, reorder_level=5)
                db.add(product)
                db.flush()
            else:
                product.category_id = categories[category_name].id
                product.description = description
                product.price = Decimal(str(price))
                product.is_available = True
                if not product.inventory:
                    product.inventory = Inventory(quantity=stock, reorder_level=5)

            products[name] = product
            ensure_image(db, product)

        db.flush()

        if db.query(Order).filter(Order.business_id == business.id).count() == 0:
            for status, product_name, qty in [
                ("completed", "Linen Everyday Shirt", 2),
                ("processing", "Minimal Gold Earrings", 1),
                ("pending", "Classic Street Sneakers", 1),
            ]:
                product = products[product_name]
                order = Order(
                    business_id=business.id,
                    customer_id=customer.id,
                    status=status,
                    total_amount=product.price * qty,
                )
                db.add(order)
                db.flush()
                db.add(OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=qty,
                    unit_price=product.price,
                ))

        db.commit()
        print("AURA deployment catalog is ready.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
