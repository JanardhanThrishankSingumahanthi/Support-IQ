from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_pagination
from app.db.models import SupportTicket, TicketEvent, TicketMessage, User

router = APIRouter(prefix="/support-tickets", tags=["support-tickets"])

ALLOWED_STATUSES = {"Open", "In Progress", "Resolved", "Escalated", "Closed"}
ALLOWED_PRIORITIES = {"Low", "Medium", "High", "Urgent"}


class TicketCreateRequest(BaseModel):
    customer_name: str | None = Field(default=None, min_length=1, max_length=255)
    customer_email: str | None = Field(default=None, min_length=1, max_length=255)
    subject: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=12000)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    priority: str = Field(default="Medium")
    source: str | None = Field(default=None, min_length=1, max_length=100)
    context: dict[str, Any] | None = None


class TicketUpdateRequest(BaseModel):
    status: str | None = Field(default=None, min_length=1, max_length=50)
    priority: str | None = Field(default=None, min_length=1, max_length=50)
    assigned_agent_id: int | None = None
    customer_name: str | None = Field(default=None, min_length=1, max_length=255)
    customer_email: str | None = Field(default=None, min_length=1, max_length=255)
    subject: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1, max_length=12000)
    resolution_note: str | None = Field(default=None, min_length=1, max_length=12000)


class TicketReplyRequest(BaseModel):
    content: str = Field(min_length=1, max_length=12000)
    sender_type: str = Field(default="agent")


class TicketEscalateRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=200)
    conversation_id: int | None = None
    question: str | None = None
    answer: str | None = None
    reliability: dict[str, Any] | None = None
    evidence: list[dict[str, Any]] | None = None


def serialize_ticket(ticket: SupportTicket) -> dict[str, Any]:
    return {
        "id": ticket.id,
        "user_id": ticket.user_id,
        "assigned_agent_id": ticket.assigned_agent_id,
        "conversation_id": ticket.conversation_id,
        "customer_name": ticket.customer_name,
        "customer_email": ticket.customer_email,
        "subject": ticket.title,
        "description": ticket.description,
        "category": ticket.category,
        "status": ticket.status,
        "priority": ticket.priority,
        "source": ticket.source,
        "reason": ticket.reason,
        "issue_question": ticket.issue_question,
        "ai_answer": ticket.ai_answer,
        "escalation_reason": ticket.escalation_reason,
        "reliability": ticket.reliability_json,
        "evidence": ticket.evidence_json,
        "resolution_note": ticket.resolution_note,
        "resolved_at": ticket.resolved_at,
        "created_at": ticket.created_at,
        "updated_at": ticket.updated_at,
        "messages": [
            {
                "id": item.id,
                "ticket_id": item.ticket_id,
                "sender_type": item.sender_type,
                "sender_id": item.sender_id,
                "content": item.content,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
            for item in sorted(ticket.messages, key=lambda item: item.created_at)
        ],
        "events": [
            {
                "id": item.id,
                "ticket_id": item.ticket_id,
                "event_type": item.event_type,
                "details_json": item.details_json,
                "created_at": item.created_at,
                "updated_at": item.updated_at,
            }
            for item in sorted(ticket.events, key=lambda item: item.created_at)
        ],
    }


def _normalize_status(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    if normalized in ALLOWED_STATUSES:
        return normalized
    return None


def _normalize_priority(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    if normalized in ALLOWED_PRIORITIES:
        return normalized
    return None


@router.get("")
def list_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pagination: dict = Depends(get_pagination),
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    search: str | None = Query(default=None),
):
    query = db.query(SupportTicket)
    if current_user.role and current_user.role.name != "Administrator":
        query = query.filter((SupportTicket.user_id == current_user.id) | (SupportTicket.assigned_agent_id == current_user.id))
    if status:
        query = query.filter(SupportTicket.status == status)
    if priority:
        query = query.filter(SupportTicket.priority == priority)
    if search:
        value = search.strip().lower()
        query = query.filter(
            (SupportTicket.title.ilike(f"%{value}%"))
            | (SupportTicket.description.ilike(f"%{value}%"))
            | (SupportTicket.customer_name.ilike(f"%{value}%"))
            | (SupportTicket.customer_email.ilike(f"%{value}%"))
        )

    total = query.count()
    items = query.order_by(SupportTicket.updated_at.desc()).offset((pagination["page"] - 1) * pagination["page_size"]).limit(pagination["page_size"]).all()
    payload = {
        "items": [serialize_ticket(item) for item in items],
        "total": total,
        "page": pagination["page"],
        "page_size": pagination["page_size"],
        "has_next": (pagination["page"] * pagination["page_size"]) < total,
        "has_previous": pagination["page"] > 1,
        "meta": {"page": pagination["page"], "page_size": pagination["page_size"], "total": total, "has_next": (pagination["page"] * pagination["page_size"]) < total, "has_previous": pagination["page"] > 1},
    }
    return payload


@router.get("/{ticket_id}")
def get_ticket(ticket_id: int = Path(..., gt=0), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Ticket was not found."})
    if current_user.role and current_user.role.name != "Administrator" and ticket.user_id != current_user.id and ticket.assigned_agent_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"status": "forbidden", "message": "You do not have access to this ticket."})
    return serialize_ticket(ticket)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_ticket(payload: TicketCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    normalized_priority = _normalize_priority(payload.priority) or "Medium"
    title = (payload.subject or "General support request").strip()

    ticket = SupportTicket(
        user_id=current_user.id,
        customer_name=payload.customer_name or current_user.full_name,
        customer_email=payload.customer_email or current_user.email,
        title=title,
        description=payload.description,
        category=payload.category or "General",
        status="Open",
        priority=normalized_priority,
        source=payload.source or "web",
        reason=(payload.context or {}).get("escalation_reason") if isinstance(payload.context, dict) else None,
        issue_question=(payload.context or {}).get("question") if isinstance(payload.context, dict) else None,
        ai_answer=(payload.context or {}).get("answer") if isinstance(payload.context, dict) else None,
        escalation_reason=(payload.context or {}).get("escalation_reason") if isinstance(payload.context, dict) else None,
        reliability_json=(payload.context or {}).get("reliability") if isinstance(payload.context, dict) else None,
        evidence_json={"items": (payload.context or {}).get("evidence", [])} if isinstance(payload.context, dict) else None,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    event = TicketEvent(ticket_id=ticket.id, event_type="created", details_json={"source": ticket.source, "category": ticket.category})
    db.add(event)
    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket)


@router.post("/{ticket_id}/reply")
def add_ticket_reply(ticket_id: int = Path(..., gt=0), payload: TicketReplyRequest = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Ticket was not found."})

    message = TicketMessage(ticket_id=ticket.id, sender_type=payload.sender_type, sender_id=current_user.id, content=payload.content)
    db.add(message)
    ticket.status = "In Progress" if ticket.status == "Open" else ticket.status
    db.commit()
    return {"status": "ok", "message": "Reply added.", "ticket": serialize_ticket(ticket), "message": {"id": message.id, "ticket_id": ticket.id, "content": payload.content}} 


@router.post("/{ticket_id}/escalate")
def escalate_ticket(ticket_id: int = Path(..., gt=0), payload: TicketEscalateRequest = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Ticket was not found."})

    ticket.status = "Escalated"
    ticket.reason = payload.reason
    ticket.escalation_reason = payload.reason
    ticket.issue_question = payload.question or ticket.issue_question
    ticket.ai_answer = payload.answer or ticket.ai_answer
    ticket.reliability_json = payload.reliability or ticket.reliability_json
    ticket.evidence_json = {"items": payload.evidence or []}
    ticket.conversation_id = payload.conversation_id or ticket.conversation_id

    db.add(TicketEvent(ticket_id=ticket.id, event_type="escalated", details_json={"reason": payload.reason, "conversation_id": payload.conversation_id}))
    db.commit()
    db.refresh(ticket)
    return serialize_ticket(ticket)


@router.patch("/{ticket_id}")
def update_ticket(ticket_id: int = Path(..., gt=0), payload: TicketUpdateRequest = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Ticket was not found."})

    if payload.status is not None:
        normalized = _normalize_status(payload.status)
        if normalized is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"status": "invalid_status", "message": "Ticket status must be one of: Open, In Progress, Resolved, Escalated, Closed."})
        ticket.status = normalized
        if normalized == "Resolved":
            ticket.resolved_at = datetime.utcnow()
        elif normalized in {"Open", "In Progress", "Escalated"}:
            ticket.resolved_at = None

    if payload.priority is not None:
        normalized = _normalize_priority(payload.priority)
        if normalized is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"status": "invalid_priority", "message": "Ticket priority must be one of: Low, Medium, High, Urgent."})
        ticket.priority = normalized
    if payload.assigned_agent_id is not None:
        ticket.assigned_agent_id = payload.assigned_agent_id
    if payload.customer_name is not None:
        ticket.customer_name = payload.customer_name.strip() or ticket.customer_name
    if payload.customer_email is not None:
        ticket.customer_email = payload.customer_email.strip() or ticket.customer_email
    if payload.subject is not None:
        ticket.title = payload.subject.strip() or ticket.title
    if payload.description is not None:
        ticket.description = payload.description.strip() or ticket.description
    if payload.resolution_note is not None:
        ticket.resolution_note = payload.resolution_note.strip() or ticket.resolution_note

    db.commit(); db.refresh(ticket)
    return serialize_ticket(ticket)


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(ticket_id: int = Path(..., gt=0), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Ticket was not found."})
    db.delete(ticket)
    db.commit()
    return None
