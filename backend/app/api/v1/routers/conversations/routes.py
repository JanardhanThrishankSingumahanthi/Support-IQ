from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, get_pagination
from app.api.schemas import ErrorResponse, PaginatedResponse
from app.db.models import Conversation, Message, User

router = APIRouter(prefix="/conversations", tags=["conversations"])


class ConversationCreateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)


class MessageRead(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    metadata_json: dict | None = None
    created_at: datetime
    updated_at: datetime


class ConversationRead(BaseModel):
    id: int
    user_id: int | None
    title: str | None
    state: str
    created_at: datetime
    updated_at: datetime
    messages: list[MessageRead] = []


class ConversationUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    state: str | None = Field(default=None, min_length=1, max_length=50)


def serialize_message(message: Message) -> dict:
    return {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "role": message.role,
        "content": message.content,
        "metadata_json": message.metadata_json,
        "created_at": message.created_at,
        "updated_at": message.updated_at,
    }


def serialize_conversation(conversation: Conversation) -> dict:
    items = sorted(conversation.messages, key=lambda message: message.created_at)
    return {
        "id": conversation.id,
        "user_id": conversation.user_id,
        "title": conversation.title,
        "state": conversation.state,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "messages": [serialize_message(message) for message in items],
    }


@router.get("")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    pagination: dict = Depends(get_pagination),
    status_filter: str | None = Query(default=None),
):
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)
    if status_filter:
        query = query.filter(Conversation.state == status_filter)

    total = query.count()
    items = query.order_by(Conversation.updated_at.desc()).offset((pagination["page"] - 1) * pagination["page_size"]).limit(pagination["page_size"]).all()

    return {
        "items": [serialize_conversation(item) for item in items],
        "meta": {
            "page": pagination["page"],
            "page_size": pagination["page_size"],
            "total": total,
            "has_next": (pagination["page"] * pagination["page_size"]) < total,
            "has_previous": pagination["page"] > 1,
        },
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    title = (payload.title or "New conversation").strip() or "New conversation"
    conversation = Conversation(user_id=current_user.id, title=title, state="open")
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return serialize_conversation(conversation)


@router.get("/{conversation_id}")
def get_conversation(
    conversation_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Conversation was not found."})
    return serialize_conversation(conversation)


@router.patch("/{conversation_id}")
def update_conversation(
    payload: ConversationUpdateRequest,
    conversation_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Conversation was not found."})

    if payload.title is not None:
        conversation.title = payload.title.strip() or conversation.title
    if payload.state is not None:
        conversation.state = payload.state

    db.commit()
    db.refresh(conversation)
    return serialize_conversation(conversation)


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int = Path(..., gt=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if conversation is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Conversation was not found."})

    db.delete(conversation)
    db.commit()

    return None
