from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile, HTTPException

from app.config import settings
from app.services.rag import ALLOWED, DOC_DIR


EXTENSION_MIME = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
}


async def save_document(file: UploadFile):
    filename = (file.filename or "").strip()
    suffix = Path(filename).suffix.lower()

    # Browsers/proxies are allowed to send application/octet-stream (or no
    # content type) for DOCX/TXT uploads. The extension is the reliable
    # signal, so validate both but do not reject a valid file merely because
    # the client supplied a generic MIME type.
    if suffix not in ALLOWED.values():
        raise HTTPException(400, "Only PDF, DOCX and TXT documents are supported.")

    detected_mime = EXTENSION_MIME[suffix]
    supplied_mime = (file.content_type or "").split(";", 1)[0].strip().lower()

    if supplied_mime and supplied_mime not in {
        detected_mime,
        "application/octet-stream",
        "binary/octet-stream",
    }:
        # Keep the extension as the source of truth for safe, known document
        # types, while preventing unrelated extensions from being accepted.
        raise HTTPException(
            400,
            f"Unsupported document type '{supplied_mime}'. Please upload a PDF, DOCX or TXT file.",
        )

    data = await file.read()
    limit = settings.max_document_size_mb * 1024 * 1024

    if len(data) > limit:
        raise HTTPException(
            413,
            f"Document exceeds the {settings.max_document_size_mb} MB limit.",
        )

    if not data:
        raise HTTPException(400, "The selected document is empty.")

    storage = f"{uuid4().hex}{suffix}"
    path = DOC_DIR / storage

    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    except OSError as exc:
        raise HTTPException(
            500,
            f"Document storage is unavailable: {type(exc).__name__}: {exc}",
        ) from exc

    return storage, filename or storage, len(data), path
