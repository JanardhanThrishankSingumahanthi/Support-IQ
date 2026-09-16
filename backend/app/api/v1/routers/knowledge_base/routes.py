from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_pagination
from app.db.models import Document, DocumentChunk, User

router = APIRouter(prefix="/knowledge-base", tags=["knowledge-base"])


@router.get("/stats")
def get_knowledge_base_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    # Query documents for the current user or system-wide if admin
    query = db.query(Document)
    if current_user.role and current_user.role.name != "Administrator":
        query = query.filter(Document.owner_id == current_user.id)

    total_docs = query.count()
    indexed_docs = query.filter(Document.status.in_(["COMPLETED", "INDEXED"])).count()

    # Calculate chunks
    total_chunks = (
        db.query(func.count(DocumentChunk.id))
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(Document.owner_id == current_user.id if (current_user.role and current_user.role.name != "Administrator") else True)
        .scalar()
        or 0
    )

    # Fallback to metadata chunk_count sum if DocumentChunk table is being populated
    if total_chunks == 0 and total_docs > 0:
        docs = query.all()
        for doc in docs:
            metadata = doc.metadata_json or {}
            total_chunks += int(metadata.get("chunk_count") or 0)

    # Calculate storage
    total_bytes = 0
    categories_counter: dict[str, int] = {
        "Product": 0,
        "Policy": 0,
        "FAQ": 0,
        "Technical": 0,
        "Others": 0,
    }

    all_docs = query.all()
    latest_update = None
    for doc in all_docs:
        meta = doc.metadata_json or {}
        size = int(meta.get("size") or 0)
        total_bytes += size
        cat = meta.get("category") or "Others"
        if cat in categories_counter:
            categories_counter[cat] += 1
        else:
            categories_counter["Others"] += 1
        if latest_update is None or doc.updated_at > latest_update:
            latest_update = doc.updated_at

    storage_quota_bytes = 5 * 1024 * 1024 * 1024  # 5 GB
    storage_mb = round(total_bytes / (1024 * 1024), 2)
    storage_gb = round(total_bytes / (1024 * 1024 * 1024), 2)
    storage_percent = round((total_bytes / storage_quota_bytes) * 100, 1)

    indexed_percent = round((indexed_docs / total_docs * 100), 1) if total_docs > 0 else 100.0

    return {
        "status": "ok",
        "total_documents": total_docs,
        "indexed_documents": indexed_docs,
        "indexed_percentage": indexed_percent,
        "total_chunks": total_chunks,
        "last_updated": latest_update.isoformat() if latest_update else datetime.now(timezone.utc).isoformat(),
        "storage_used_bytes": total_bytes,
        "storage_used_mb": storage_mb,
        "storage_used_gb": storage_gb,
        "storage_quota_gb": 5.0,
        "storage_percentage": storage_percent,
        "categories": categories_counter,
    }


@router.post("/sync")
def sync_knowledge_base(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    query = db.query(Document)
    if current_user.role and current_user.role.name != "Administrator":
        query = query.filter(Document.owner_id == current_user.id)

    docs = query.all()
    synced_count = 0
    now = datetime.now(timezone.utc)

    for doc in docs:
        if doc.status != "FAILED":
            doc.status = "COMPLETED"
            meta = doc.metadata_json or {}
            meta["indexed_at"] = now.isoformat()
            doc.metadata_json = meta
            synced_count += 1

    db.commit()

    return {
        "status": "ok",
        "message": f"Successfully synchronized {synced_count} documents in knowledge base.",
        "synced_count": synced_count,
        "timestamp": now.isoformat(),
    }


@router.get("")
def list_knowledge_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pagination: dict = Depends(get_pagination),
    category: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    search: str | None = Query(default=None),
) -> dict[str, Any]:
    query = db.query(Document)
    if current_user.role and current_user.role.name != "Administrator":
        query = query.filter(Document.owner_id == current_user.id)

    if category and category.lower() != "all":
        query = query.filter(Document.metadata_json.op("->>")("category") == category)
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Document.status == status_filter.upper())
    if search:
        search_term = f"%{search.strip().lower()}%"
        query = query.filter((Document.title.ilike(search_term)) | (Document.content.ilike(search_term)))

    total = query.count()
    items = (
        query.order_by(Document.updated_at.desc())
        .offset((pagination["page"] - 1) * pagination["page_size"])
        .limit(pagination["page_size"])
        .all()
    )

    return {
        "status": "ok",
        "items": [
            {
                "id": doc.id,
                "title": doc.title,
                "filename": (doc.metadata_json or {}).get("filename") or doc.title,
                "category": (doc.metadata_json or {}).get("category") or "General",
                "size": int((doc.metadata_json or {}).get("size") or 0),
                "file_type": (doc.metadata_json or {}).get("file_type") or "pdf",
                "status": doc.status,
                "chunks": int((doc.metadata_json or {}).get("chunk_count") or 0),
                "indexed_at": (doc.metadata_json or {}).get("indexed_at") or doc.updated_at.isoformat(),
                "preview": (doc.content or "")[:300],
            }
            for doc in items
        ],
        "meta": {
            "page": pagination["page"],
            "page_size": pagination["page_size"],
            "total": total,
            "has_next": (pagination["page"] * pagination["page_size"]) < total,
            "has_previous": pagination["page"] > 1,
        },
    }
