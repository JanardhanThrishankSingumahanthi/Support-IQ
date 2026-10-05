from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import AnswerFeedback, Conversation, Message, User

router = APIRouter(prefix="/feedback", tags=["feedback"])

ALLOWED_NEGATIVE_REASONS = {
    "Answer is incorrect",
    "Answer is incomplete",
    "Evidence is not relevant",
    "Citation is incorrect",
    "Answer was unclear",
    "Other",
}


class AnswerFeedbackCreateRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    message_id: int = Field(..., description="ID of the assistant message to provide feedback for")
    feedback_type: str = Field(..., description="'positive' or 'negative'")
    reason: str | None = Field(default=None, max_length=150, description="Structured reason")
    comment: str | None = Field(default=None, max_length=1000, description="Optional text feedback")


def serialize_feedback(item: AnswerFeedback) -> dict[str, Any]:
    return {
        "id": item.id,
        "user_id": item.user_id,
        "conversation_id": item.conversation_id,
        "message_id": item.message_id,
        "feedback_type": item.feedback_type,
        "reason": item.reason,
        "comment": item.comment,
        "created_at": item.created_at.isoformat() if item.created_at else None,
        "updated_at": item.updated_at.isoformat() if item.updated_at else None,
    }


def is_privileged_user(user: User) -> bool:
    if user.is_superuser:
        return True
    if user.role and user.role.name in ["Administrator", "Support Agent", "Data Scientist", "Knowledge Manager"]:
        return True
    return False


@router.post("", status_code=status.HTTP_201_CREATED)
def submit_answer_feedback(
    payload: AnswerFeedbackCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Submits or updates 👍/👎 feedback for a specific assistant message."""
    norm_type = payload.feedback_type.strip().lower()
    if norm_type not in ["positive", "negative"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "invalid_feedback_type", "message": "Feedback type must be 'positive' or 'negative'."},
        )

    # Validate message exists
    message = db.query(Message).filter(Message.id == payload.message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"status": "message_not_found", "message": f"Message with ID {payload.message_id} was not found."},
        )

    if message.role != "assistant":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "invalid_target", "message": "Feedback can only be submitted for assistant messages."},
        )

    # Validate user ownership of the conversation containing this message
    conversation = db.query(Conversation).filter(Conversation.id == message.conversation_id).first()
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"status": "conversation_not_found", "message": "Conversation for this message was not found."},
        )

    # Cross-user isolation: User A cannot submit feedback on User B's conversation
    if conversation.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"status": "unauthorized", "message": "You are not authorized to submit feedback for another user's answer."},
        )

    # Validate reason
    clean_reason = payload.reason.strip() if payload.reason else None
    if norm_type == "negative" and clean_reason:
        # Check against allowed negative reasons
        if clean_reason not in ALLOWED_NEGATIVE_REASONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "status": "invalid_reason",
                    "message": f"Invalid negative feedback reason. Must be one of: {', '.join(sorted(ALLOWED_NEGATIVE_REASONS))}.",
                },
            )

    clean_comment = payload.comment.strip() if payload.comment else None

    # Check for existing feedback on this (user, message)
    existing = (
        db.query(AnswerFeedback)
        .filter(AnswerFeedback.user_id == current_user.id, AnswerFeedback.message_id == message.id)
        .first()
    )

    if existing:
        existing.feedback_type = norm_type
        existing.reason = clean_reason
        existing.comment = clean_comment
        db.commit()
        db.refresh(existing)
        return {
            "status": "updated",
            "message": "Answer feedback updated successfully.",
            "feedback": serialize_feedback(existing),
        }

    feedback = AnswerFeedback(
        user_id=current_user.id,
        conversation_id=conversation.id,
        message_id=message.id,
        feedback_type=norm_type,
        reason=clean_reason,
        comment=clean_comment,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {
        "status": "created",
        "message": "Answer feedback recorded successfully.",
        "feedback": serialize_feedback(feedback),
    }


@router.get("/my")
def get_my_feedback(
    conversation_id: int | None = Query(default=None),
    message_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Retrieves feedback records submitted by the current authenticated user."""
    query = db.query(AnswerFeedback).filter(AnswerFeedback.user_id == current_user.id)
    if conversation_id is not None:
        query = query.filter(AnswerFeedback.conversation_id == conversation_id)
    if message_id is not None:
        query = query.filter(AnswerFeedback.message_id == message_id)

    items = query.order_by(AnswerFeedback.created_at.desc()).all()
    return {
        "status": "ok",
        "total": len(items),
        "items": [serialize_feedback(item) for item in items],
    }


@router.get("/message/{message_id}")
def get_message_feedback(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Retrieves current user's feedback for a specific message, if any."""
    item = (
        db.query(AnswerFeedback)
        .filter(AnswerFeedback.user_id == current_user.id, AnswerFeedback.message_id == message_id)
        .first()
    )
    return {
        "status": "ok",
        "message_id": message_id,
        "has_feedback": item is not None,
        "feedback": serialize_feedback(item) if item else None,
    }


@router.delete("/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Deletes an existing feedback record owned by the authenticated user."""
    feedback = db.query(AnswerFeedback).filter(AnswerFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"status": "not_found", "message": "Feedback record not found."},
        )

    if feedback.user_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"status": "unauthorized", "message": "Cannot delete feedback submitted by another user."},
        )

    db.delete(feedback)
    db.commit()
    return {"status": "ok", "message": "Feedback deleted successfully."}


@router.get("/analytics")
def get_feedback_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Returns aggregated feedback analytics. Restricted to privileged staff/administrators."""
    if not is_privileged_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"status": "forbidden", "message": "Access to feedback analytics is restricted to administrators and support staff."},
        )

    total_feedback = db.query(func.count(AnswerFeedback.id)).scalar() or 0
    positive_count = (
        db.query(func.count(AnswerFeedback.id))
        .filter(AnswerFeedback.feedback_type == "positive")
        .scalar()
        or 0
    )
    negative_count = (
        db.query(func.count(AnswerFeedback.id))
        .filter(AnswerFeedback.feedback_type == "negative")
        .scalar()
        or 0
    )

    total_answers = (
        db.query(func.count(Message.id))
        .filter(Message.role == "assistant")
        .scalar()
        or 0
    )

    if total_feedback > 0:
        pos_pct = round((positive_count / total_feedback) * 100, 1)
        neg_pct = round((negative_count / total_feedback) * 100, 1)
        feedback_rate = round((total_feedback / max(1, total_answers)) * 100, 1)
    else:
        pos_pct = None
        neg_pct = None
        feedback_rate = 0.0

    # Reason breakdown for negative feedback
    reasons_query = (
        db.query(AnswerFeedback.reason, func.count(AnswerFeedback.id))
        .filter(AnswerFeedback.feedback_type == "negative", AnswerFeedback.reason.isnot(None))
        .group_by(AnswerFeedback.reason)
        .all()
    )
    reasons_list = [
        {
            "reason": r,
            "count": count,
            "percent": round((count / max(1, negative_count)) * 100, 1) if negative_count > 0 else 0.0,
        }
        for r, count in sorted(reasons_query, key=lambda x: x[1], reverse=True)
    ]

    # Recent feedback items (up to 20) with question and answer previews
    recent_records = (
        db.query(AnswerFeedback)
        .order_by(AnswerFeedback.created_at.desc())
        .limit(20)
        .all()
    )

    recent_items = []
    for item in recent_records:
        user_obj = db.query(User).filter(User.id == item.user_id).first()
        asst_msg = db.query(Message).filter(Message.id == item.message_id).first()
        # Find preceding user message in conversation
        user_query_text = ""
        if asst_msg:
            preceding_user_msg = (
                db.query(Message)
                .filter(
                    Message.conversation_id == item.conversation_id,
                    Message.role == "user",
                    Message.created_at <= asst_msg.created_at,
                )
                .order_by(Message.created_at.desc())
                .first()
            )
            if preceding_user_msg:
                user_query_text = preceding_user_msg.content

        recent_items.append(
            {
                "id": item.id,
                "created_at": item.created_at.isoformat() if item.created_at else None,
                "user_email": user_obj.email if user_obj else "Unknown",
                "user_name": user_obj.full_name if user_obj else "Unknown",
                "feedback_type": item.feedback_type,
                "reason": item.reason,
                "comment": item.comment,
                "question": user_query_text[:120] if user_query_text else "N/A",
                "answer_snippet": asst_msg.content[:150] if asst_msg else "N/A",
                "status": (asst_msg.metadata_json or {}).get("status", "resolved") if asst_msg else "resolved",
            }
        )

    metrics_obj = {
        "has_data": total_feedback > 0,
        "total_feedback": total_feedback,
        "positive_feedback": positive_count,
        "negative_feedback": negative_count,
        "positive_percentage": pos_pct,
        "negative_percentage": neg_pct,
        "feedback_rate_percent": feedback_rate,
        "reason_breakdown": {r["reason"]: r["count"] for r in reasons_list},
    }

    return {
        "status": "ok",
        "has_data": total_feedback > 0,
        "total_feedback": total_feedback,
        "positive_count": positive_count,
        "negative_count": negative_count,
        "positive_percentage": pos_pct,
        "negative_percentage": neg_pct,
        "feedback_rate": feedback_rate,
        "total_answers": total_answers,
        "reasons": reasons_list,
        "metrics": metrics_obj,
        "recent_feedback": recent_items,
        "metric_scope": "Operational User Sentiment",
        "notice": "User feedback reflects end-user operational satisfaction and is tracked independently from offline benchmark metrics.",
    }
