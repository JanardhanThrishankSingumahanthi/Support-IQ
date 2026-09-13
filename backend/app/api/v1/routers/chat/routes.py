from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.api.v1.routers.conversations.routes import serialize_conversation
from app.db.models import Conversation, Message, User

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessageRequest(BaseModel):
    conversation_id: int | None = None
    content: str = Field(min_length=1, max_length=12000)
    title: str | None = Field(default=None, min_length=1, max_length=255)


def derive_title(content: str) -> str:
    cleaned = " ".join(content.strip().split())
    return cleaned[:40].strip() or "New conversation"


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
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"status": "invalid_message", "message": "Message content cannot be empty."})

    if payload.conversation_id is not None:
        conversation = db.query(Conversation).filter(Conversation.id == payload.conversation_id, Conversation.user_id == current_user.id).first()
        if conversation is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"status": "not_found", "message": "Conversation was not found."})
    else:
        title = (payload.title or derive_title(content)).strip() or "New conversation"
        conversation = Conversation(user_id=current_user.id, title=title, state="open")
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    user_message = Message(conversation_id=conversation.id, role="user", content=content)
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content="AI response unavailable until the retrieval pipeline is enabled.",
        metadata_json={"status": "unavailable", "service": "retrieval"},
    )

    db.add_all([user_message, assistant_message])
    conversation.title = payload.title or conversation.title or derive_title(content)
    conversation.state = "open"
    db.commit()
    db.refresh(conversation)

    return {
        "status": "ok",
        "message": "Message received.",
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
        "generation_status": "unavailable",
    }
