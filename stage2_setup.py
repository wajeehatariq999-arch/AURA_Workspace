from decimal import Decimal
from pathlib import Path

from app.database import SessionLocal
from app.models import (
    Business,
    ProductCategory,
    Product,
    ProductImage,
    Inventory,
)


BASE = Path(__file__).resolve().parent
IMAGE_DIR = BASE / "data" / "product_images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)


CATEGORIES = [
    (
        "Fashion & Clothing",
        "Clothing, shirts, dresses and everyday fashion.",
    ),
    (
        "Shoes & Footwear",
        "Sneakers, shoes and everyday footwear.",
    ),
    (
        "Jewellery & Accessories",
        "Jewellery, watches and fashion accessories.",
    ),
    (
        "Home & Living",
        "Home decoration, useful essentials and lifestyle items.",
    ),
    (
        "Bags",
        "Handbags, shoulder bags and everyday carry items.",
    ),
    (
        "Beauty & Personal Care",
        "Beauty, skincare and personal care products.",
    ),
    (
        "Electronics & Gadgets",
        "Useful electronics and modern gadgets.",
    ),
    (
        "Gifts & Lifestyle",
        "Gift sets and lifestyle products.",
    ),
]


def make_svg(title, subtitle):
    return f"""
<svg xmlns="http://www.w3.org/2000/svg"
     width="1200"
     height="900"
     viewBox="0 0 1200 900">

    <defs>
        <linearGradient id="bg"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1">
            <stop offset="0%" stop-color="#173c32"/>
            <stop offset="100%" stop-color="#d4b77a"/>
        </linearGradient>
    </defs>

    <rect width="1200" height="900" fill="url(#bg)"/>

    <circle
        cx="930"
        cy="180"
        r="230"
        fill="#ffffff"
        opacity="0.10"
    />

    <circle
        cx="180"
        cy="760"
        r="260"
        fill="#ffffff"
        opacity="0.08"
    />

    <text
        x="90"
        y="150"
        fill="#ffffff"
        opacity="0.75"
        font-family="Georgia, serif"
        font-size="32"
        letter-spacing="7">
        AURA
    </text>

    <text
        x="90"
        y="660"
        fill="#ffffff"
        font-family="Georgia, serif"
        font-size="62">
        {title}
    </text>

    <text
        x="90"
        y="720"
        fill="#ffffff"
        opacity="0.82"
        font-family="Arial, sans-serif"
        font-size="26">
        {subtitle}
    </text>

</svg>
"""


def add_product(
    db,
    business,
    category,
    name,
    description,
    price,
    stock,
):
    existing = (
        db.query(Product)
        .filter(
            Product.business_id == business.id,
            Product.name == name,
        )
        .first()
    )

    if existing:
        return existing

    product = Product(
        business_id=business.id,
        category_id=category.id,
        name=name,
        description=description,
        price=Decimal(str(price)),
        is_available=True,
    )

    product.inventory = Inventory(
        quantity=stock,
        reorder_level=5,
    )

    db.add(product)
    db.flush()

    storage_name = f"stage2-{product.id}.svg"

    svg = make_svg(
        name,
        category.name,
    )

    (IMAGE_DIR / storage_name).write_text(
        svg,
        encoding="utf-8",
    )

    db.add(
        ProductImage(
            product_id=product.id,
            storage_name=storage_name,
            original_name=storage_name,
            mime_type="image/svg+xml",
            file_size=len(svg.encode("utf-8")),
            is_primary=True,
        )
    )

    return product


db = SessionLocal()

try:
    business = (
        db.query(Business)
        .filter(Business.name == "AURA Demo Commerce")
        .first()
    )

    if not business:
        print("AURA Demo Commerce was not found.")
        print("Please run: python seed.py")
        raise SystemExit(1)

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

    # Upgrade the original demo products if they still have
    # their original demo names.
    upgrades = {
        "Mountain Arabica Beans": (
            "Linen Everyday Shirt",
            "A comfortable everyday shirt with a clean modern look.",
            "Fashion & Clothing",
        ),
        "Earl Grey Reserve": (
            "Classic Street Sneakers",
            "Clean everyday sneakers designed for casual outfits.",
            "Shoes & Footwear",
        ),
        "Stoneware Mug": (
            "Minimal Gold Earrings",
            "Elegant minimal earrings for everyday styling.",
            "Jewellery & Accessories",
        ),
        "Cold Brew Bottle": (
            "Textured Shoulder Bag",
            "A practical shoulder bag with a refined everyday design.",
            "Bags",
        ),
        "Jasmine Green Tea": (
            "AURA Body Care Set",
            "A simple personal-care set for an everyday self-care routine.",
            "Beauty & Personal Care",
        ),
    }

    for old_name, values in upgrades.items():
        product = (
            db.query(Product)
            .filter(
                Product.business_id == business.id,
                Product.name == old_name,
            )
            .first()
        )

        if product:
            new_name, description, category_name = values

            product.name = new_name
            product.description = description
            product.category_id = categories[category_name].id

    db.flush()

    # Add demo products for the remaining categories.
    add_product(
        db,
        business,
        categories["Home & Living"],
        "Modern Table Lamp",
        "A simple modern lamp for a warm home setup.",
        4200,
        10,
    )

    add_product(
        db,
        business,
        categories["Electronics & Gadgets"],
        "Wireless Earbuds",
        "Compact wireless earbuds for everyday listening.",
        6500,
        12,
    )

    add_product(
        db,
        business,
        categories["Gifts & Lifestyle"],
        "AURA Gift Box",
        "A curated lifestyle gift box for special occasions.",
        4800,
        8,
    )

    db.commit()

    print()
    print("========================================")
    print(" AURA STAGE 2 CATALOG SETUP COMPLETE")
    print("========================================")
    print()
    print("Categories:")
    for category in categories.values():
        print(" -", category.name)

    print()
    print("Your existing database was NOT deleted.")
    print("You can now start AURA and test the customer store.")
    print()

finally:
    db.close()