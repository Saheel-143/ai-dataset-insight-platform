"""
Intelligent Dataset Chatbot API Handlers
"""
import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from backend.models.schemas import ChatMessageRequest, ChatMessageResponse, ChatHistoryItem, UserProfile
from backend.services.storage_service import storage_service
from backend.services.database_service import db_service
from backend.chatbot.engine import chatbot_engine
from backend.handlers.auth_handler import get_current_user

router = APIRouter(prefix="/api/chatbot", tags=["AI Chatbot"])

@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(req: ChatMessageRequest, user: UserProfile = Depends(get_current_user)):
    meta = db_service.get_dataset(req.dataset_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    conv_id = req.conversation_id or f"conv-{req.dataset_id}-{user.id}"

    try:
        df = storage_service.load_dataframe(meta["storage_key"], meta["filename"])
        return chatbot_engine.process_query(
            df=df,
            dataset_meta=meta,
            query=req.message.strip(),
            conversation_id=conv_id,
            user_id=user.id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chatbot failed to process query: {str(e)}")

@router.get("/history/{dataset_id}", response_model=List[ChatHistoryItem])
def get_chat_history(
    dataset_id: str,
    conversation_id: Optional[str] = Query(None),
    user: UserProfile = Depends(get_current_user)
):
    meta = db_service.get_dataset(dataset_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    history = db_service.get_chat_history(dataset_id, conversation_id)
    return [ChatHistoryItem(**h) for h in history]

@router.delete("/history/{dataset_id}")
def clear_chat_history(
    dataset_id: str,
    conversation_id: Optional[str] = Query(None),
    user: UserProfile = Depends(get_current_user)
):
    meta = db_service.get_dataset(dataset_id)
    if not meta or meta.get("user_id") != user.id:
        raise HTTPException(status_code=404, detail="Dataset not found or unauthorized.")

    db_service.clear_chat_history(dataset_id, conversation_id)
    return {"message": "Chat history cleared successfully."}

