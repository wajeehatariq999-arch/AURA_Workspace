from pathlib import Path

from app.database import SessionLocal
from app.models import Product, ProductImage


BASE = Path(__file__).resolve().parent
IMAGE_DIR = BASE / "data" / "product_images"


PRODUCT_PHOTOS = {
    "Linen Everyday Shirt" : "casual-shirt.jpg",
    "Classic Street Sneakers": "street-shoes.jpg",
    "Minimal Gold Earrings": "gold-earings.jpg",
    "Textured Shoulder Bag": "textured-bag.jpg",
    "AURA Body Care Set": "skin-care.jpg",
    "Modern Table Lamp": "table-lamp.jpg",
    "Wireless Earbuds": "wireless-earbuds.jpg",
    "AURA Gift Box": "gift-box.jpg",
}


def get_mime_type(filename):
    extension = Path(filename).suffix.lower()

    if extension in [".jpg", ".jpeg"]:
        return "image/jpeg"

    if extension == ".png":
        return "image/png"

    if extension == ".webp":
        return "image/webp"

    return "application/octet-stream"


db = SessionLocal()

try:
    for product_name, photo_name in PRODUCT_PHOTOS.items():

        product = (
            db.query(Product)
            .filter(Product.name == product_name)
            .first()
        )

        if not product:
            print(f"PRODUCT NOT FOUND: {product_name}")
            continue

        photo_path = IMAGE_DIR / photo_name

        if not photo_path.exists():
            print(f"PHOTO NOT FOUND: {photo_name}")
            continue

        image = (
            db.query(ProductImage)
            .filter(ProductImage.product_id == product.id)
            .first()
        )

        if image:
            image.storage_name = photo_name
            image.original_name = photo_name
            image.mime_type = get_mime_type(photo_name)
            image.file_size = photo_path.stat().st_size
            image.is_primary = True
        else:
            db.add(
                ProductImage(
                    product_id=product.id,
                    storage_name=photo_name,
                    original_name=photo_name,
                    mime_type=get_mime_type(photo_name),
                    file_size=photo_path.stat().st_size,
                    is_primary=True,
                )
            )

        print(
            f"CONNECTED: {product_name} -> {photo_name}"
        )

    db.commit()

    print()
    print("Product photos updated successfully.")

finally:
    db.close()