from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import crud, schemas
from database import get_db

router = APIRouter()

@router.get("/users/{user_id}/conversations/", response_model=list[schemas.Conversation])
def get_conversations(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.conversations

@router.post("/users/{user_id}/conversations/", response_model=schemas.Conversation)
def create_conversation(user_id: int, conversation: schemas.ConversationCreate, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_conversation(db=db, conversation=conversation, user_id=user_id)

@router.delete("/conversations/{conversation_id}", response_model=schemas.Conversation)
def delete_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conversation = crud.get_conversation(db, conversation_id=conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    crud.delete_conversation(db=db, conversation_id=conversation_id)
    return conversation
