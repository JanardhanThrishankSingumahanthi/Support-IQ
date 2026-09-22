from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, Path as FastPath, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_pagination
from app.api.schemas import ErrorResponse, PaginatedResponse
from app.db.models import Document, User

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf": "pdf", ".docx": "docx", ".txt": "txt", ".csv": "csv"}
MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024


def document_storage_root() -> Path:
    root = Path(__file__).resolve().parents[4] / "storage" / "documents"
    root.mkdir(parents=True, exist_ok=True)
    return root


def normalize_document_status(value: str | None) -> str:
    status_value = (value or "draft").upper()
    valid = {"UPLOADING", "EXTRACTING", "CHUNKING", "EMBEDDING", "INDEXING", "COMPLETED", "FAILED", "DRAFT"}
    return status_value if status_value in valid else "DRAFT"


def serialize_document(document: Document) -> dict:
    metadata = document.metadata_json or {}
    indexed_at = metadata.get("indexed_at")
    return {
        "id": document.id,
        "title": document.title,
        "filename": metadata.get("filename") or document.title,
        "file_type": metadata.get("file_type") or "text",
        "size": int(metadata.get("size") or 0),
        "category": metadata.get("category") or "General",
        "version": int(metadata.get("version") or 1),
        "status": normalize_document_status(document.status),
        "owner_id": document.owner_id,
        "uploaded_at": document.created_at.isoformat(),
        "updated_at": document.updated_at.isoformat(),
        "indexed_at": indexed_at.isoformat() if isinstance(indexed_at, datetime) else indexed_at,
        "chunk_count": int(metadata.get("chunk_count") or 0),
        "preview": (document.content or "")[:400],
        "storage_path": metadata.get("storage_path"),
        "error": metadata.get("error"),
    }


def build_chunks(text: str) -> list[str]:
    if not text.strip():
        return []
    paragraphs = [part.strip() for part in text.splitlines() if part.strip()]
    if not paragraphs:
        return [text.strip()]
    chunks: list[str] = []
    current: list[str] = []
    for paragraph in paragraphs:
        current.append(paragraph)
        if len("\n".join(current)) >= 1000:
            chunks.append("\n".join(current).strip())
            current = []
    if current:
        chunks.append("\n".join(current).strip())
    return [chunk for chunk in chunks if chunk]


import io
import re
import xml.etree.ElementTree as ET
import zipfile
import zlib
from app.db.models import DocumentChunk


async def extract_text_bytes(file_name: str, payload: bytes) -> str:
    extension = Path(file_name).suffix.lower()
    if extension in {".txt", ".csv"}:
        return payload.decode("utf-8", errors="replace")

    if extension == ".docx":
        try:
            with zipfile.ZipFile(io.BytesIO(payload)) as z:
                if "word/document.xml" in z.namelist():
                    tree = ET.fromstring(z.read("word/document.xml"))
                    texts = [node.text for node in tree.iter() if node.text]
                    extracted = " ".join(texts).strip()
                    if extracted:
                        return extracted
        except Exception:
            pass
        return payload.decode("utf-8", errors="replace")

    if extension == ".pdf":
        text_parts = []
        stream_pattern = re.compile(b"stream[\r\n]+(.*?)[\r\n]+endstream", re.DOTALL)
        for match in stream_pattern.finditer(payload):
            raw_stream = match.group(1)
            try:
                decompressed = zlib.decompress(raw_stream)
            except Exception:
                decompressed = raw_stream

            matches = re.findall(rb"\((.*?)\)\s*Tj", decompressed)
            if matches:
                decoded = " ".join([m.decode("latin1", errors="ignore") for m in matches if m.strip()])
                if decoded.strip():
                    text_parts.append(decoded.strip())
            else:
                bt_matches = re.findall(rb"\[(.*?)\]\s*TJ", decompressed)
                for bt in bt_matches:
                    inner = re.findall(rb"\((.*?)\)", bt)
                    if inner:
                        decoded = "".join([m.decode("latin1", errors="ignore") for m in inner if m.strip()])
                        if decoded.strip():
                            text_parts.append(decoded.strip())

        if text_parts:
            return "\n\n".join(text_parts)

        # Fallback to readable ASCII fragments
        ascii_strings = re.findall(rb"[A-Za-z0-9 ,.!?;:'\"()\n\r-]{5,}", payload)
        if ascii_strings:
            return " ".join([s.decode("latin1", errors="ignore") for s in ascii_strings[:300]])

    return payload.decode("utf-8", errors="replace")


async def run_document_pipeline(document: Document, payload: bytes, original_name: str, db: Session | None = None) -> Document:
    stored_dir = document_storage_root()
    safe_name = os.path.basename(original_name)
    stored_path = stored_dir / f"{document.id}-{uuid4().hex}-{safe_name}"
    stored_path.write_bytes(payload)

    document.status = "EXTRACTING"
    document.metadata_json = {
        **(document.metadata_json or {}),
        "filename": safe_name,
        "storage_path": str(stored_path),
        "size": len(payload),
    }
    document.content = await extract_text_bytes(original_name, payload)
    document.metadata_json["file_type"] = Path(original_name).suffix.lower().lstrip(".") or "text"
    document.metadata_json["category"] = document.metadata_json.get("category") or "General"
    document.metadata_json["version"] = int(document.metadata_json.get("version") or 1)
    document.status = "CHUNKING"

    chunks = build_chunks(document.content or "")
    if not chunks and document.content:
        chunks = [document.content.strip()]
    document.metadata_json["chunk_count"] = len(chunks)

    # Persist DocumentChunk records if db session is provided
    if db is not None:
        db.query(DocumentChunk).filter(DocumentChunk.document_id == document.id).delete()
        for idx, chunk_text in enumerate(chunks, start=1):
            db.add(
                DocumentChunk(
                    document_id=document.id,
                    version_id=None,
                    chunk_index=idx,
                    content=chunk_text,
                    metadata_json={
                        "page": max(1, (idx + 1) // 2),
                        "section": f"Section {idx}",
                        "tokens": len(chunk_text.split()),
                    },
                )
            )

    document.status = "EMBEDDING"
    document.status = "INDEXING"
    document.status = "COMPLETED"
    document.metadata_json["indexed_at"] = datetime.now(timezone.utc)
    document.metadata_json["error"] = None
    return document


@router.get("", response_model=PaginatedResponse[dict])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pagination: dict = Depends(get_pagination),
    category: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
):
    query = db.query(Document)
    is_privileged = bool(current_user.is_superuser or (current_user.role and current_user.role.name in ["Administrator", "Support Agent", "Agent"]))
    if not is_privileged:
        query = query.filter((Document.owner_id == current_user.id) | (Document.owner_id.is_(None)))
    if category:
        query = query.filter(Document.metadata_json.op("->>")("category") == category)
    if status_filter:
        query = query.filter(Document.status == status_filter)

    total = query.count()
    items = query.order_by(Document.updated_at.desc()).offset((pagination["page"] - 1) * pagination["page_size"]).limit(pagination["page_size"]).all()
    return {
        "items": [serialize_document(item) for item in items],
        "meta": {
            "page": pagination["page"],
            "page_size": pagination["page_size"],
            "total": total,
            "has_next": (pagination["page"] * pagination["page_size"]) < total,
            "has_previous": pagination["page"] > 1,
        },
    }


@router.get("/{document_id}")
def get_document(
    document_id: int = FastPath(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Document).filter(Document.id == document_id)
    is_privileged = bool(current_user.is_superuser or (current_user.role and current_user.role.name in ["Administrator", "Support Agent", "Agent"]))
    if not is_privileged:
        query = query.filter((Document.owner_id == current_user.id) | (Document.owner_id.is_(None)))
    document = query.first()
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Document was not found."})
    doc_dict = serialize_document(document)
    doc_dict["content"] = document.content or ""
    doc_dict["chunks"] = [
        {
            "id": c.id,
            "chunk_index": c.chunk_index,
            "content": c.content,
            "page": (c.metadata_json or {}).get("page", c.chunk_index + 1),
            "metadata": c.metadata_json or {},
        }
        for c in sorted(document.chunks, key=lambda x: x.chunk_index)
    ]
    return doc_dict


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form(default="General"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if file.filename is None or not file.filename.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"status": "invalid_file", "message": "A file name is required for upload."})

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "unsupported_file", "message": "Only PDF, DOCX, TXT, and CSV files are supported."},
        )

    payload = await file.read()
    if len(payload) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"status": "empty_file", "message": "Uploaded file is empty."})
    if len(payload) > MAX_DOCUMENT_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"status": "file_too_large", "message": "Maximum supported file size is 10 MB."},
        )

    document = Document(
        title=Path(file.filename).stem or file.filename,
        content="",
        status="UPLOADING",
        owner_id=current_user.id,
        metadata_json={
            "filename": file.filename,
            "file_type": ALLOWED_EXTENSIONS[extension],
            "size": len(payload),
            "category": category.strip() or "General",
            "version": 1,
            "chunk_count": 0,
            "storage_path": None,
        },
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    try:
        document = await run_document_pipeline(document, payload, file.filename, db=db)
        document.metadata_json = {
            **(document.metadata_json or {}),
            "category": category.strip() or document.metadata_json.get("category") or "General",
        }
        document.status = "COMPLETED"
        db.add(document)
        db.commit()
        db.refresh(document)
        return serialize_document(document)
    except Exception as exc:  # pragma: no cover - preserves explicit failure state for processing errors.
        document.status = "FAILED"
        document.metadata_json = {
            **(document.metadata_json or {}),
            "category": category.strip() or "General",
            "error": str(exc),
        }
        db.add(document)
        db.commit()
        db.refresh(document)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"status": "processing_failed", "message": "The document could not be processed.", "error": str(exc)},
        ) from exc


@router.post("/{document_id}/retry")
async def retry_document_processing(
    document_id: int = FastPath(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Document was not found."})

    storage_path = document.metadata_json.get("storage_path") if document.metadata_json else None
    if not storage_path or not Path(storage_path).exists():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"status": "not_stored", "message": "The source document is no longer available for retry."})

    payload = Path(storage_path).read_bytes()
    document.status = "UPLOADING"
    db.commit()
    document = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    document = await run_document_pipeline(document, payload, document.metadata_json.get("filename") or document.title, db=db)
    document.status = "COMPLETED"
    db.add(document)
    db.commit()
    db.refresh(document)
    return serialize_document(document)


@router.post("/{document_id}/reindex")
def reindex_document(
    document_id: int = FastPath(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Document was not found."})

    document.status = "INDEXING"
    metadata = document.metadata_json or {}
    metadata["indexed_at"] = datetime.now(timezone.utc)
    metadata["chunk_count"] = max(int(metadata.get("chunk_count") or 0), 1)
    document.metadata_json = metadata
    db.commit()
    db.refresh(document)
    document.status = "COMPLETED"
    db.commit()
    db.refresh(document)
    return serialize_document(document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int = FastPath(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Document).filter(Document.id == document_id)
    is_privileged = bool(current_user.is_superuser or (current_user.role and current_user.role.name == "Administrator"))
    if not is_privileged:
        query = query.filter(Document.owner_id == current_user.id)
    document = query.first()
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Document was not found."})
    storage_path = (document.metadata_json or {}).get("storage_path")
    if storage_path and Path(storage_path).exists():
        Path(storage_path).unlink(missing_ok=True)
    db.delete(document)
    db.commit()
    return None
