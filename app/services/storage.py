from pathlib import Path
from uuid import uuid4
from PIL import Image
from fastapi import HTTPException, UploadFile
from app.config import settings

ROOT = Path("data")
PRODUCT_DIR = ROOT / "product_images"
LOGO_DIR = ROOT / "uploads" / "logos"
ALLOWED_MIME = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_BYTES = settings.max_upload_size_mb * 1024 * 1024

async def _save_image(upload: UploadFile, target_dir: Path, prefix: str = "") -> tuple[str, str, int]:
    if upload.content_type not in ALLOWED_MIME:
        raise HTTPException(400, "Only JPEG, PNG and WebP images are allowed")
    original = Path(upload.filename or "image").name
    if len(original) > 255 or original.startswith("."):
        raise HTTPException(400, "Invalid image filename")
    data = await upload.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, f"Image exceeds {settings.max_upload_size_mb} MB limit")
    try:
        from io import BytesIO
        with Image.open(BytesIO(data)) as im:
            im.verify()
        with Image.open(BytesIO(data)) as im:
            if im.width > 5000 or im.height > 5000:
                raise HTTPException(400, "Image dimensions are too large")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "Uploaded file is not a valid image")
    storage_name = f"{uuid4().hex}{ALLOWED_MIME[upload.content_type]}"
    target_dir.mkdir(parents=True, exist_ok=True)
    (target_dir / storage_name).write_bytes(data)
    return storage_name, original, len(data)

def delete_product_image(storage_name: str):
    path = PRODUCT_DIR / Path(storage_name).name
    if path.exists(): path.unlink()

async def save_product_image(upload: UploadFile):
    storage_name, original, size = await _save_image(upload, PRODUCT_DIR)
    data = (PRODUCT_DIR / storage_name).read_bytes()
    return storage_name, original, size, data

async def save_logo_image(upload: UploadFile):
    return await _save_image(upload, LOGO_DIR)

def delete_logo_image(storage_name: str):
    path = LOGO_DIR / Path(storage_name).name
    if path.exists(): path.unlink()
