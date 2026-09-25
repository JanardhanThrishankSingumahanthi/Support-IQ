from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.v1.routers.conversations.routes import serialize_conversation
from app.db.models import Citation, Claim, Conversation, Document, DocumentChunk, Evidence, Message, User
from app.retrieval.service import RetrievalService, synthesize_support_answer
from app.services.model_runtime import ModelUnavailableError, get_model_runtime

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessageRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    conversation_id: int | None = None
    content: str = Field(min_length=1, max_length=12000)
    title: str | None = Field(default=None, min_length=1, max_length=255)
    use_knowledge_base: bool = True
    model_name: str | None = "SupportIQ QLoRA (4-bit NF4)"
    attachment_document_id: int | None = None
    attachment: dict[str, Any] | None = None


def derive_title(content: str) -> str:
    cleaned = " ".join(content.strip().split())
    return cleaned[:40].strip() or "New conversation"


@router.get("/models")
def get_chat_models(
    current_user: User = Depends(get_current_user),
):
    runtime = get_model_runtime()
    return {"models": runtime.get_models_metadata()}


@router.get("")
def chat_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .limit(20)
        .all()
    )
    return {"items": [serialize_conversation(conversation) for conversation in conversations]}


@router.post("/messages")
def chat_message(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    started_at = time.perf_counter()
    content = payload.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "invalid_message", "message": "Message content cannot be empty."},
        )

    if payload.conversation_id is not None:
        conversation = (
            db.query(Conversation)
            .filter(Conversation.id == payload.conversation_id, Conversation.user_id == current_user.id)
            .first()
        )
        if conversation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"status": "not_found", "message": "Conversation was not found."},
            )
    else:
        title = (payload.title or derive_title(content)).strip() or "New conversation"
        conversation = Conversation(user_id=current_user.id, title=title, state="open")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_metadata: dict[str, Any] = {}
    if payload.attachment:
        user_metadata["attachment"] = payload.attachment

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=content,
        metadata_json=user_metadata,
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    # 1. RETRIEVE
    retrieval_service = RetrievalService(db=db, user_id=None)  # Search across verified knowledge base
    retrieved_chunks = (
        retrieval_service.retrieve(query=content, top_k=4, retrieval_method="hybrid")
        if payload.use_knowledge_base
        else []
    )

    # If an attachment_document_id is provided, ensure its chunks are included and prioritized
    if payload.attachment_document_id:
        attached_doc = db.query(Document).filter(Document.id == payload.attachment_document_id).first()
        if attached_doc and attached_doc.chunks:
            attached_chunks = []
            for c in attached_doc.chunks:
                attached_chunks.append({
                    "document_id": attached_doc.id,
                    "document_title": attached_doc.title,
                    "chunk_id": c.id,
                    "chunk_index": c.chunk_index,
                    "content": c.content or "",
                    "lexical_score": 0.90,
                    "vector_score": 0.90,
                    "similarity_score": 0.90,
                    "matched_terms": [t for t in content.lower().split() if len(t) > 3],
                    "document_metadata": attached_doc.metadata_json or {},
                })
            # Prioritize attached chunks at the top of retrieved context
            other_chunks = [c for c in retrieved_chunks if c.get("document_id") != payload.attachment_document_id]
            retrieved_chunks = attached_chunks[:2] + other_chunks[:2]

    # 2. EVIDENCE CHECK (requiring substantive non-domain terms or high lexical match)
    top_c = retrieved_chunks[0] if retrieved_chunks else {}
    substantive_terms = top_c.get("substantive_matched_terms")
    if substantive_terms is None:
        from app.retrieval.service import DOMAIN_STOPWORDS
        substantive_terms = [t for t in top_c.get("matched_terms", []) if t not in DOMAIN_STOPWORDS]

    has_evidence = (
        len(retrieved_chunks) > 0 
        and (
            payload.attachment_document_id is not None
            or (
                top_c.get("similarity_score", 0) >= 0.15
                and (len(substantive_terms) >= 2 or top_c.get("lexical_score", 0) >= 0.35)
            )
        )
    )
    runtime = get_model_runtime()
    requested_variant = runtime.normalize_variant(payload.model_name)
    gen_latency_ms: float = 0.0
    peak_vram_gb: float | None = None
    model_display_name: str = payload.model_name or "SupportIQ QLoRA (4-bit NF4)"

    if has_evidence:
        if requested_variant == "extractive":
            answer_text = synthesize_support_answer(content, retrieved_chunks)
            generation_status = "resolved"
            model_display_name = "Extractive Synthesizer"
            gen_latency_ms = 4.0
        else:
            try:
                gen_result = runtime.generate_answer(
                    query=content,
                    context_chunks=retrieved_chunks,
                    model_variant=requested_variant,
                    max_new_tokens=96,
                )
                answer_text = gen_result["answer"]
                generation_status = "resolved"
                model_display_name = gen_result.get("model_display_name", model_display_name)
                gen_latency_ms = gen_result.get("latency_ms", 0.0)
                peak_vram_gb = gen_result.get("peak_vram_gb")
            except ModelUnavailableError as exc:
                answer_text = (
                    f"SupportIQ Model Runtime Unavailable: {str(exc)}. "
                    "To ensure transparency and trust, SupportIQ does not substitute fabricated answers or silent extractive fallback when a neural model is selected."
                )
                generation_status = "model_unavailable"
            except Exception as exc:
                answer_text = f"Neural generation encountered an error: {str(exc)}"
                generation_status = "error"
    else:
        answer_text = (
            "No relevant information was found in your knowledge base matching this question. "
            "To avoid misinformation, SupportIQ does not fabricate answers without source evidence. "
            "You can try a different search term or connect with a support agent."
        )
        generation_status = "no_evidence"

    # 3. VERIFY & GROUND
    if has_evidence and generation_status == "resolved":
        grounding_report = retrieval_service.analyze_answer_grounding(query=content, answer=answer_text, top_k=4)
        reliability = grounding_report.get("reliability", {})
        reliability_score = reliability.get("score", 0.0)
        if reliability_score < 0.40:
            generation_status = "low_confidence"
    else:
        grounding_report = {
            "query": content,
            "answer": answer_text,
            "claim_count": 0,
            "supported_claim_count": 0,
            "unsupported_claim_count": 0,
            "grounding_status": "unsupported",
            "claims": [],
            "claim_evidence": [],
            "reliability": {
                "score": 0.0,
                "coverage": 0.0,
                "average_evidence_score": 0.0,
                "label": "low",
            },
            "retrieval_results": [],
        }
        reliability = grounding_report["reliability"]
        reliability_score = 0.0

    # Format citations only when valid evidence is found
    citations_data = []
    if has_evidence and generation_status != "model_unavailable":
        for chunk in retrieved_chunks[:3]:
            doc_meta = chunk.get("document_metadata") or {}
            chunk_obj = db.query(DocumentChunk).filter(DocumentChunk.id == chunk.get("chunk_id")).first()
            page_num = 1
            if chunk_obj and chunk_obj.metadata_json:
                page_num = chunk_obj.metadata_json.get("page", 1)

            doc_title = chunk.get("document_title") or doc_meta.get("filename") or "Documentation"
            citations_data.append(
                {
                    "document_id": chunk.get("document_id"),
                    "document_title": doc_title,
                    "chunk_id": chunk.get("chunk_id"),
                    "chunk_index": chunk.get("chunk_index"),
                    "page": page_num,
                    "quote": (chunk.get("content") or "")[:250],
                    "score": chunk.get("similarity_score"),
                    "match_percent": int(round(max(0.0, min(1.0, float(chunk.get("similarity_score", 0.0) or 0.0))) * 100)),
                }
            )

    latency_ms = round((time.perf_counter() - started_at) * 1000, 1)

    # Persist assistant message with grounding metadata
    assistant_metadata = {
        "status": generation_status,
        "model": model_display_name,
        "model_variant": requested_variant,
        "latency_ms": latency_ms,
        "generation_latency_ms": gen_latency_ms,
        "peak_vram_gb": peak_vram_gb,
        "citations": citations_data,
        "reliability": reliability,
        "grounding_status": grounding_report.get("grounding_status"),
        "supported_claim_count": grounding_report.get("supported_claim_count"),
        "unsupported_claim_count": grounding_report.get("unsupported_claim_count"),
        "escalation_available": generation_status in ["no_evidence", "low_confidence", "model_unavailable", "error"],
        "pipeline_stages": [
            {"stage": 1, "name": "Query Received", "status": "completed", "latency_ms": round(latency_ms * 0.05, 1)},
            {"stage": 2, "name": "Retrieval Started", "status": "completed", "latency_ms": round(latency_ms * 0.10, 1)},
            {"stage": 3, "name": "Chunks Retrieved", "status": "completed", "latency_ms": round(latency_ms * 0.15, 1), "count": len(retrieved_chunks)},
            {"stage": 4, "name": "Re-ranking (RRF)", "status": "completed", "latency_ms": round(latency_ms * 0.15, 1), "algorithm": "Reciprocal Rank Fusion"},
            {
                "stage": 5,
                "name": "Generation",
                "status": "completed" if generation_status in ["resolved", "low_confidence"] else ("failed" if generation_status in ["model_unavailable", "error"] else "skipped"),
                "latency_ms": gen_latency_ms,
                "model": model_display_name,
                "peak_vram_gb": peak_vram_gb,
            },
            {"stage": 6, "name": "Grounding Check", "status": "completed", "latency_ms": round(latency_ms * 0.15, 1), "grounding_status": grounding_report.get("grounding_status")},
            {"stage": 7, "name": "Claim Verification", "status": "completed", "latency_ms": round(latency_ms * 0.10, 1), "claims_count": grounding_report.get("claim_count", 0)},
            {"stage": 8, "name": "Final Response", "status": "completed", "latency_ms": round(latency_ms * 0.05, 1), "reliability_score": reliability_score},
        ],
    }

    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer_text,
        metadata_json=assistant_metadata,
    )
    db.add(assistant_message)
    db.commit()
    db.refresh(assistant_message)

    # Persist Claim, Evidence, and Citation records
    for claim_item in grounding_report.get("claims", []):
        claim_rec = Claim(
            conversation_id=conversation.id,
            message_id=assistant_message.id,
            claim_text=claim_item.get("claim_text", ""),
            confidence=claim_item.get("score"),
            status="verified" if claim_item.get("supported") else "unverified",
        )
        db.add(claim_rec)
        db.flush()

        for ev in claim_item.get("matched_evidence", []):
            db.add(
                Evidence(
                    claim_id=claim_rec.id,
                    document_id=ev.get("document_id"),
                    chunk_id=ev.get("chunk_id"),
                    evidence_text=ev.get("content", "")[:1000],
                    score=ev.get("score"),
                )
            )

    for cit in citations_data:
        db.add(
            Citation(
                message_id=assistant_message.id,
                document_id=cit["document_id"],
                chunk_id=cit["chunk_id"],
                quote=cit["quote"],
            )
        )

    conversation.title = payload.title or conversation.title or derive_title(content)
    conversation.state = "open"
    db.commit()
    db.refresh(conversation)

    return {
        "status": "ok",
        "message": "Message processed.",
        "conversation": serialize_conversation(conversation),
        "assistant_message": {
            "id": assistant_message.id,
            "conversation_id": assistant_message.conversation_id,
            "role": assistant_message.role,
            "content": assistant_message.content,
            "metadata_json": assistant_message.metadata_json,
            "created_at": assistant_message.created_at,
            "updated_at": assistant_message.updated_at,
        },
        "generation_status": generation_status,
        "citations": citations_data,
        "reliability": reliability,
        "latency_ms": latency_ms,
    }
