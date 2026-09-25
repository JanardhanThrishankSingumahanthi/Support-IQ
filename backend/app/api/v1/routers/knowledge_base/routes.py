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

    failed_docs = query.filter(Document.status == "FAILED").count()
    pending_docs = query.filter(Document.status.in_(["UPLOADING", "EXTRACTING", "CHUNKING", "EMBEDDING", "INDEXING"])).count()

    return {
        "status": "ok",
        "total_documents": total_docs,
        "indexed_documents": indexed_docs,
        "failed_documents": failed_docs,
        "pending_documents": pending_docs,
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


@router.get("/index-status")
def get_knowledge_base_index_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    query = db.query(Document)
    if current_user.role and current_user.role.name != "Administrator":
        query = query.filter(Document.owner_id == current_user.id)

    total_docs = query.count()
    indexed_docs = query.filter(Document.status.in_(["COMPLETED", "INDEXED"])).count()
    failed_docs = query.filter(Document.status == "FAILED").count()
    pending_docs = query.filter(Document.status.in_(["UPLOADING", "EXTRACTING", "CHUNKING", "EMBEDDING", "INDEXING"])).count()

    total_chunks = (
        db.query(func.count(DocumentChunk.id))
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(Document.owner_id == current_user.id if (current_user.role and current_user.role.name != "Administrator") else True)
        .scalar()
        or 0
    )

    if total_chunks == 0 and total_docs > 0:
        docs = query.all()
        for doc in docs:
            metadata = doc.metadata_json or {}
            total_chunks += int(metadata.get("chunk_count") or 0)

    all_docs = query.all()
    latest_indexed_at = None
    for doc in all_docs:
        meta = doc.metadata_json or {}
        idx_at = meta.get("indexed_at")
        if idx_at:
            if latest_indexed_at is None or str(idx_at) > str(latest_indexed_at):
                latest_indexed_at = str(idx_at)
        elif doc.updated_at:
            dt_iso = doc.updated_at.isoformat()
            if latest_indexed_at is None or dt_iso > str(latest_indexed_at):
                latest_indexed_at = dt_iso

    if total_docs == 0:
        index_health = "IDLE"
        health_label = "Idle (No documents)"
    elif failed_docs > 0:
        index_health = "DEGRADED"
        health_label = f"Degraded ({failed_docs} document(s) failed)"
    elif pending_docs > 0:
        index_health = "INDEXING"
        health_label = f"Indexing ({pending_docs} document(s) in progress)"
    else:
        index_health = "HEALTHY"
        health_label = "Healthy / Fully Indexed"

    indexed_percent = round((indexed_docs / total_docs * 100), 1) if total_docs > 0 else 100.0

    return {
        "status": "ok",
        "index_health": index_health,
        "health_label": health_label,
        "total_documents": total_docs,
        "indexed_documents": indexed_docs,
        "failed_documents": failed_docs,
        "pending_documents": pending_docs,
        "indexed_percentage": indexed_percent,
        "total_chunks": total_chunks,
        "last_indexed_at": latest_indexed_at or datetime.now(timezone.utc).isoformat(),
        "embedding_model": "Deterministic Token Hash Vector (32-dim, SHA-1)",
        "embedding_dimensions": 32,
        "retrieval_method": "Two-Stage Hybrid (BM25 Lexical + Cosine Vector + RRF)",
        "vector_storage": "SQLite Relational DocumentChunk Table",
    }


@router.get("/settings")
def get_knowledge_base_settings(
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    return {
        "status": "ok",
        "configurable": False,
        "notice": "These settings are fixed by the current SupportIQ runtime.",
        "chunk_size_chars": 1000,
        "chunk_overlap_chars": 0,
        "chunking_strategy": "Paragraph boundary chunking (1000 char threshold)",
        "embedding_model": "Deterministic Token Hash Vector (32-dim, SHA-1)",
        "embedding_dimensions": 32,
        "retrieval_top_k": 5,
        "max_top_k": 20,
        "similarity_threshold": 0.12,
        "reranker_algorithm": "Reciprocal Rank Fusion (RRF, k=60)",
        "fusion_weights": "60% Lexical / 40% Dense Vector",
        "max_document_size_mb": 10,
        "supported_file_formats": ["PDF", "DOCX", "TXT", "CSV"],
        "storage_quota_gb": 5.0,
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
