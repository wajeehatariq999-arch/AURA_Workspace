from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
PHOTO_DIR = ROOT / "data" / "product_images"

# The real product photos that belong to the 8 shopping products.
PHOTO_MAP = {
    "Linen Everyday Shirt": "casual-shirt.jpg",
    "Classic Street Sneakers": "street-shoes.jpg",
    "Minimal Gold Earrings": "gold-earings.jpg",
    "Textured Shoulder Bag": "textured-bag.jpg",
    "AURA Body Care Set": "skin-care.jpg",
    "Modern Table Lamp": "table-lamp.jpg",
    "Wireless Earbuds": "wireless-earbuds.jpg",
    "AURA Gift Box": "gift-box.jpg",
}

print("\nAURA repair starting...\n")

# 1) Check/fix the existing photo-mapping script.
fix_file = ROOT / "fix_product_photos.py"
if fix_file.exists():
    text = fix_file.read_text(encoding="utf-8")
    # The public repository currently has the correct Product.name == product_name
    # lookup. This replacement also repairs older local copies that used photo_name.
    text = text.replace('.filter(Product.name == photo_name)',
                        '.filter(Product.name == product_name)')
    fix_file.write_text(text, encoding="utf-8")
    print("✓ Checked/fixed fix_product_photos.py")

# 2) Repair the database image records and activate customer accounts.
try:
    sys.path.insert(0, str(ROOT))
    from app.database import SessionLocal
    from app.models import Product, ProductImage, User

    db = SessionLocal()
    try:
        for user in db.query(User).filter(User.role == "customer").all():
            if not user.is_active:
                user.is_active = True
                print(f"✓ Activated customer: {user.email}")

        for product_name, photo_name in PHOTO_MAP.items():
            product = (
                db.query(Product)
                .filter(Product.name == product_name)
                .first()
            )

            if not product:
                print(f"⚠ Product not found: {product_name}")
                continue

            photo_path = PHOTO_DIR / photo_name
            if not photo_path.exists():
                print(f"⚠ Photo missing locally: {photo_name}")
                continue

            mime = "image/jpeg" if photo_path.suffix.lower() in {".jpg", ".jpeg"} else "image/png"

            image = (
                db.query(ProductImage)
                .filter(ProductImage.product_id == product.id)
                .first()
            )

            if image:
                image.storage_name = photo_name
                image.original_name = photo_name
                image.mime_type = mime
                image.file_size = photo_path.stat().st_size
                image.is_primary = True
            else:
                db.add(
                    ProductImage(
                        product_id=product.id,
                        storage_name=photo_name,
                        original_name=photo_name,
                        mime_type=mime,
                        file_size=photo_path.stat().st_size,
                        is_primary=True,
                    )
                )

            print(f"✓ {product_name}  ->  {photo_name}")

        db.commit()
    finally:
        db.close()

except Exception as exc:
    print("\nDatabase repair failed:")
    print(type(exc).__name__, exc)
    raise

# 3) Make FastAPI Cloud include the product images in the deployment package.
ignore_file = ROOT / ".fastapicloudignore"
ignore_file.write_text(
    "!data/aura.db\n"
    "!data/product_images/\n"
    "!data/product_images/*\n",
    encoding="utf-8",
)
print("✓ .fastapicloudignore keeps product images in the deployment package")

# 4) Make Git stop ignoring the actual product image files.
gitignore = ROOT / ".gitignore"
if gitignore.exists():
    lines = gitignore.read_text(encoding="utf-8").splitlines()
    cleaned = []
    for line in lines:
        if line.strip() == "data/product_images/*":
            continue
        cleaned.append(line)
    # Keep the folder itself usable in Git while allowing JPG/PNG/WebP files.
    gitignore.write_text("\n".join(cleaned).rstrip() + "\n", encoding="utf-8")
    print("✓ .gitignore no longer ignores real product images")

print("\nAURA repair finished.")
print("\nNext command:")
print("  python fix_product_photos.py")
print("\nThen deploy:")
print("  fastapi deploy --app-id 264332d3")
print("\nIMPORTANT: after deployment, sign out of AURA, refresh the page, and sign in again.")
