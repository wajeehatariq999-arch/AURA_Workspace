from __future__ import annotations
import re
import uuid
from pathlib import Path
from typing import Iterable
from sqlalchemy.orm import Session
from app.config import settings
from app.models import KnowledgeDocument, KnowledgeChunk

BASE = Path(__file__).resolve().parents[2]
DOC_DIR = BASE / "data" / "documents"
DOC_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "text/plain": ".txt",
}

_embedder = None
_client = None


def _load_dependencies():
    global _embedder, _client
    if _embedder is None:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer(settings.embedding_model)
    if _client is None:
        import chromadb
        _client = chromadb.PersistentClient(path=str(BASE / "data" / "vector_store"))
    return _embedder, _client


def _collection_name(business_id: int) -> str:
    return f"{settings.rag_collection_prefix}_{business_id}"


def _extract_pdf(path: Path) -> list[tuple[str, int | None, str | None]]:
    from pypdf import PdfReader
    reader = PdfReader(str(path))
    return [(page.extract_text() or "", i + 1, None) for i, page in enumerate(reader.pages)]


def _extract_docx(path: Path) -> list[tuple[str, int | None, str | None]]:
    from docx import Document
    doc = Document(str(path))
    blocks = []
    current_section = None
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        if para.style and para.style.name and "Heading" in para.style.name:
            current_section = text
        blocks.append((text, None, current_section))
    return blocks


def _extract_txt(path: Path) -> list[tuple[str, int | None, str | None]]:
    return [(path.read_text(encoding="utf-8", errors="replace"), None, None)]


def extract_document(path: Path, mime_type: str) -> list[tuple[str, int | None, str | None]]:
    if mime_type == "application/pdf":
        return _extract_pdf(path)
    if mime_type.endswith("wordprocessingml.document"):
        return _extract_docx(path)
    return _extract_txt(path)


def clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def chunk_blocks(blocks: Iterable[tuple[str, int | None, str | None]], max_chars: int = 1200, overlap: int = 180):
    chunks = []
    for raw, page, section in blocks:
        text = clean_text(raw)
        if not text:
            continue
        start = 0
        while start < len(text):
            end = min(len(text), start + max_chars)
            if end < len(text):
                boundary = text.rfind(" ", start, end)
                if boundary > start + 300:
                    end = boundary
            chunks.append((text[start:end], page, section))
            if end >= len(text):
                break
            start = max(0, end - overlap)
    return chunks


def delete_document_vectors(document: KnowledgeDocument):
    _, client = _load_dependencies()
    collection = client.get_or_create_collection(_collection_name(document.business_id))
    ids = [c.vector_id for c in document.chunks]
    if ids:
        collection.delete(ids=ids)


def index_document(db: Session, document: KnowledgeDocument, path: Path):
    embedder, client = _load_dependencies()
    collection = client.get_or_create_collection(_collection_name(document.business_id), metadata={"hnsw:space": "cosine"})
    blocks = extract_document(path, document.mime_type)
    chunks = chunk_blocks(blocks)
    if not chunks:
        raise ValueError("The document contains no extractable text.")
    ids, texts, metas = [], [], []
    for i, (text, page, section) in enumerate(chunks):
        vector_id = f"doc{document.id}-v{document.version}-{uuid.uuid4().hex}"
        ids.append(vector_id); texts.append(text)
        metas.append({"document_id": document.id, "business_id": document.business_id, "chunk_index": i, "page": page or 0, "section": section or ""})
        db.add(KnowledgeChunk(document_id=document.id, chunk_index=i, page_number=page, section=section, content=text, vector_id=vector_id))
    vectors = embedder.encode(texts, normalize_embeddings=True).tolist()
    collection.add(ids=ids, documents=texts, embeddings=vectors, metadatas=metas)
    document.chunk_count = len(chunks)
    document.status = "indexed"
    document.error_message = None
    db.commit()


def retrieve(db: Session, business_id: int, query: str, top_k: int = 5) -> list[dict]:
    embedder, client = _load_dependencies()
    collection = client.get_or_create_collection(_collection_name(business_id))
    if collection.count() == 0:
        return []
    vector = embedder.encode([query], normalize_embeddings=True).tolist()
    result = collection.query(query_embeddings=vector, n_results=min(top_k, collection.count()), where={"business_id": business_id}, include=["documents", "metadatas", "distances"])
    out = []
    for text, meta, distance in zip(result.get("documents", [[]])[0], result.get("metadatas", [[]])[0], result.get("distances", [[]])[0]):
        doc = db.get(KnowledgeDocument, int(meta["document_id"]))
        out.append({"document_id": doc.id if doc else None, "document_name": doc.original_name if doc else "Unknown", "page": meta.get("page") or None, "section": meta.get("section") or None, "content": text, "distance": distance})
    return out
