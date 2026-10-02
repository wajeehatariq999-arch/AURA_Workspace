from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile, HTTPException
from app.config import settings
from app.services.rag import ALLOWED, DOC_DIR

async def save_document(file: UploadFile):
    suffix = Path(file.filename or "").suffix.lower()
    if file.content_type not in ALLOWED or suffix != ALLOWED[file.content_type]:
        raise HTTPException(400, "Only PDF, DOCX and TXT documents are supported.")
    data = await file.read()
    limit = settings.max_document_size_mb * 1024 * 1024
    if len(data) > limit:
        raise HTTPException(413, f"Document exceeds the {settings.max_document_size_mb} MB limit.")
    storage = f"{uuid4().hex}{suffix}"
    path = DOC_DIR / storage
    path.write_bytes(data)
    return storage, file.filename or storage, len(data), path
